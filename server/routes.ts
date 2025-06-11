import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSimpleAuth, requireAuth, requireAdmin, hashPassword } from "./simpleAuth";
import { sendInviteEmail, sendWelcomeEmail } from "./emailService";
import { createSubdomain, deleteSubdomain, generateSubdomain, findAvailableSubdomain } from "./cloudflareService";
import { detectLanguageFromRequest, translateRestaurant, translateCategory, SUPPORTED_LANGUAGES } from "./translationService";
import { insertTemplateSchema } from "../shared/schema";
import Stripe from "stripe";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { 
  insertRestaurantSchema, 
  insertCategorySchema, 
  insertMenuItemSchema, 
  insertAllergenSchema,
  insertQrCodeSchema,
  insertClientInvitationSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import QRCode from "qrcode";

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage_multer });

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable must be set');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function for checking if user is admin
async function isAdmin(req: Request): Promise<boolean> {
  const userId = (req as any).user?.id;
  if (!userId) return false;
  
  const user = await storage.getUser(userId);
  return user?.isAdmin || false;
}

// Helper middleware for admin-only routes
const adminOnly = async (req: any, res: any, next: any) => {
  const isUserAdmin = await isAdmin(req);
  if (!isUserAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupSimpleAuth(app);
  
  // Subdomain handling for restaurant menus
  app.get("/", async (req, res, next) => {
    const host = req.hostname;
    
    // Check if this is a restaurant subdomain
    if (host.includes(".menuisland.it") && !host.startsWith("www.")) {
      const subdomain = host.split(".")[0];
      try {
        const restaurant = await storage.getRestaurantBySubdomain(subdomain);
        
        if (restaurant) {
          // Increment analytics for restaurant visit
          await storage.incrementVisits(restaurant.id);
          
          // Fetch restaurant menu data
          const categories = await storage.getCategories(restaurant.id);
          const template = restaurant.templateId ? 
            await storage.getTemplate(restaurant.templateId) : 
            null;
            
          // Detect user's preferred language (from query param or browser header)
          const userLanguage = req.query.lang as string || detectLanguageFromRequest(req);
          
          // Prepare menu data with items and allergens
          let menuData = {
            restaurant,
            template,
            categories: await Promise.all(
              categories.map(async (category) => {
                const items = await storage.getMenuItems(category.id);
                return {
                  ...category,
                  items: await Promise.all(
                    items.map(async (item) => {
                      const allergens = await storage.getMenuItemAllergens(item.id);
                      return { ...item, allergens };
                    })
                  )
                };
              })
            )
          };

          // Translate menu if user language is not Italian
          if (userLanguage !== 'it') {
            try {
              menuData.restaurant = await translateRestaurant(menuData.restaurant, userLanguage);
              menuData.categories = await Promise.all(
                menuData.categories.map(category => translateCategory(category, userLanguage))
              );
            } catch (translationError) {
              console.warn('Translation failed, serving original content:', translationError);
            }
          }
          
          // Serve the restaurant menu view
          return res.json(menuData);
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      }
    }
    
    // If not a restaurant subdomain or restaurant not found, continue to next route
    next();
  });

  // Auth routes
  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email } = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        email
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Restaurant routes
  app.get("/api/restaurants", requireAuth, async (req: any, res) => {
    try {
      let restaurants;
      
      if (await isAdmin(req)) {
        // Admin sees all restaurants
        restaurants = await storage.getRestaurants();
      } else {
        // Regular users see only their restaurants
        const userId = req.user.id;
        restaurants = await storage.getRestaurantsByOwner(userId);
      }
      
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", requireAuth, async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(Number(req.params.id));
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post("/api/restaurants", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      // Check restaurant limit for non-admin users
      if (!isUserAdmin) {
        const userRestaurants = await storage.getRestaurantsByOwner(userId);
        const userProfile = await storage.getUser(userId);
        const maxRestaurants = userProfile?.maxRestaurants || 1;
        
        if (userRestaurants.length >= maxRestaurants) {
          return res.status(403).json({ 
            message: `Hai raggiunto il limite di ${maxRestaurants} ristorante${maxRestaurants > 1 ? 'i' : ''}. Contatta l'amministratore per aumentare il limite.` 
          });
        }
      }
      
      // Generate subdomain for the restaurant
      const baseSubdomain = generateSubdomain(validatedData.name);
      const availableSubdomain = await findAvailableSubdomain(baseSubdomain);
      
      // Associate the restaurant with the current user
      const restaurantData = {
        ...validatedData,
        subdomain: availableSubdomain,
        ownerId: userId
      };
      
      const restaurant = await storage.createRestaurant(restaurantData);
      
      // Create Cloudflare DNS record for the subdomain
      const subdomainCreated = await createSubdomain(availableSubdomain);
      if (!subdomainCreated) {
        console.warn(`Failed to create subdomain for restaurant ${restaurant.id}, but restaurant was created`);
      }
      
      res.status(201).json(restaurant);
    } catch (error) {
      console.error("Error creating restaurant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  app.put("/api/restaurants/:id", requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has permission (admin or owner)
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const validatedData = insertRestaurantSchema.partial().parse(req.body);
      const updatedRestaurant = await storage.updateRestaurant(id, validatedData);
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });

  app.delete("/api/restaurants/:id", requireAuth, adminOnly, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteRestaurant(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Restaurant not found" });
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).json({ message: "Failed to delete restaurant" });
    }
  });

  // Template routes
  app.get("/api/templates", requireAuth, async (_req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const template = await storage.getTemplate(Number(req.params.id));
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });
  
  app.post("/api/templates", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });
  
  app.put("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const validatedData = insertTemplateSchema.partial().parse(req.body);
      const updatedTemplate = await storage.updateTemplate(id, validatedData);
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });
  
  app.delete("/api/templates/:id", requireAuth, adminOnly, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteTemplate(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Template not found" });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Categories routes
  app.get("/api/restaurants/:id/categories", async (req, res) => {
    try {
      const restaurantId = Number(req.params.id);
      const categories = await storage.getCategories(restaurantId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      
      // Check if user has permission to add to this restaurant
      const restaurant = await storage.getRestaurant(validatedData.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if user has permission
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const updatedCategory = await storage.updateCategory(id, validatedData);
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if user has permission
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const success = await storage.deleteCategory(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Category not found" });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Menu Items routes
  app.get("/api/categories/:id/menu-items", async (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      const menuItems = await storage.getMenuItems(categoryId);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post("/api/menu-items", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertMenuItemSchema.parse(req.body);
      
      // Check if user has permission
      const category = await storage.getCategory(validatedData.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const menuItem = await storage.createMenuItem(validatedData);
      res.status(201).json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  app.get("/api/menu-items/:id/allergens", async (req, res) => {
    try {
      const menuItemId = Number(req.params.id);
      const allergens = await storage.getMenuItemAllergens(menuItemId);
      res.json(allergens);
    } catch (error) {
      console.error("Error fetching menu item allergens:", error);
      res.status(500).json({ message: "Failed to fetch menu item allergens" });
    }
  });

  app.post("/api/menu-items/:id/allergens/:allergenId", requireAuth, async (req: any, res) => {
    try {
      const menuItemId = Number(req.params.id);
      const allergenId = Number(req.params.allergenId);
      
      const menuItem = await storage.getMenuItem(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Check if user has permission
      const category = await storage.getCategory(menuItem.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      await storage.addAllergenToMenuItem(menuItemId, allergenId);
      res.status(204).end();
    } catch (error) {
      console.error("Error adding allergen to menu item:", error);
      res.status(500).json({ message: "Failed to add allergen to menu item" });
    }
  });

  app.delete("/api/menu-items/:id/allergens/:allergenId", requireAuth, async (req: any, res) => {
    try {
      const menuItemId = Number(req.params.id);
      const allergenId = Number(req.params.allergenId);
      
      const menuItem = await storage.getMenuItem(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Check if user has permission
      const category = await storage.getCategory(menuItem.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      await storage.removeAllergenFromMenuItem(menuItemId, allergenId);
      res.status(204).end();
    } catch (error) {
      console.error("Error removing allergen from menu item:", error);
      res.status(500).json({ message: "Failed to remove allergen from menu item" });
    }
  });

  app.put("/api/menu-items/:id", requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const menuItem = await storage.getMenuItem(id);
      
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Check if user has permission
      const category = await storage.getCategory(menuItem.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const validatedData = insertMenuItemSchema.partial().parse(req.body);
      const updatedMenuItem = await storage.updateMenuItem(id, validatedData);
      res.json(updatedMenuItem);
    } catch (error) {
      console.error("Error updating menu item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  app.delete("/api/menu-items/:id", requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const menuItem = await storage.getMenuItem(id);
      
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Check if user has permission
      const category = await storage.getCategory(menuItem.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const success = await storage.deleteMenuItem(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Menu item not found" });
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Allergen routes
  app.get("/api/allergens", async (_req, res) => {
    try {
      const allergens = await storage.getAllergens();
      res.json(allergens);
    } catch (error) {
      console.error("Error fetching allergens:", error);
      res.status(500).json({ message: "Failed to fetch allergens" });
    }
  });

  app.post("/api/allergens", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAllergenSchema.parse(req.body);
      const allergen = await storage.createAllergen(validatedData);
      res.status(201).json(allergen);
    } catch (error) {
      console.error("Error creating allergen:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create allergen" });
    }
  });

  app.put("/api/allergens/:id", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertAllergenSchema.partial().parse(req.body);
      const updatedAllergen = await storage.updateAllergen(id, validatedData);
      
      if (!updatedAllergen) {
        return res.status(404).json({ message: "Allergen not found" });
      }
      
      res.json(updatedAllergen);
    } catch (error) {
      console.error("Error updating allergen:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update allergen" });
    }
  });

  app.delete("/api/allergens/:id", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteAllergen(id);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Allergen not found" });
      }
    } catch (error) {
      console.error("Error deleting allergen:", error);
      res.status(500).json({ message: "Failed to delete allergen" });
    }
  });

  // QR code routes
  app.get("/api/restaurants/:id/qr-codes", requireAuth, async (req: any, res) => {
    try {
      const restaurantId = Number(req.params.id);
      const restaurant = await storage.getRestaurant(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has permission
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const qrCodes = await storage.getQrCodes(restaurantId);
      res.json(qrCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ message: "Failed to fetch QR codes" });
    }
  });

  app.post("/api/qr-codes", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertQrCodeSchema.parse(req.body);
      
      // Check if user has permission
      const restaurant = await storage.getRestaurant(validatedData.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Generate QR code
      const qrUrl = `https://${restaurant.subdomain}.menuisland.it`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2C3E50',
          light: '#FFFFFF',
        },
      });
      
      // Save QR code
      const qrCode = await storage.createQrCode({
        ...validatedData,
        qrData: qrDataUrl,
      });
      
      res.status(201).json(qrCode);
    } catch (error) {
      console.error("Error creating QR code:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create QR code" });
    }
  });

  app.delete("/api/qr-codes/:id", requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      
      // Get the QR code to check permissions
      // (would need additional storage method to get QR code by ID)
      const success = await storage.deleteQrCode(id);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "QR code not found" });
      }
    } catch (error) {
      console.error("Error deleting QR code:", error);
      res.status(500).json({ message: "Failed to delete QR code" });
    }
  });

  // Dashboard analytics - aggregated data for all user's restaurants
  app.get("/api/analytics/dashboard", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get all user's restaurants
      const userRestaurants = await storage.getRestaurantsByOwner(userId);
      
      if (userRestaurants.length === 0) {
        return res.json({
          totalVisits: 0,
          totalScans: 0,
          totalMenuItems: 0,
          totalCategories: 0,
          chartData: []
        });
      }

      // Calculate totals for the last 30 days
      let totalVisits = 0;
      let totalScans = 0;
      let totalMenuItems = 0;
      let totalCategories = 0;

      for (const restaurant of userRestaurants) {
        const analytics = await storage.getAnalytics(restaurant.id, 30);
        const categories = await storage.getCategories(restaurant.id);
        
        // Sum up visits and scans
        totalVisits += analytics.reduce((sum, day) => sum + (day.visits || 0), 0);
        totalScans += analytics.reduce((sum, day) => sum + (day.qrScans || 0), 0);
        totalCategories += categories.length;
        
        // Count menu items for this restaurant
        for (const category of categories) {
          const items = await storage.getMenuItems(category.id);
          totalMenuItems += items.length;
        }
      }

      // Create chart data for the last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        let dayVisits = 0;
        let dayScans = 0;
        
        for (const restaurant of userRestaurants) {
          const analytics = await storage.getAnalytics(restaurant.id, 7);
          const dayData = analytics.find(a => a.date && a.date.toISOString().split('T')[0] === dateStr);
          if (dayData) {
            dayVisits += dayData.visits || 0;
            dayScans += dayData.qrScans || 0;
          }
        }
        
        last7Days.push({
          date: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          visits: dayVisits,
          scans: dayScans
        });
      }

      res.json({
        totalVisits,
        totalScans,
        totalMenuItems,
        totalCategories,
        chartData: last7Days
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Analytics routes
  app.get("/api/restaurants/:id/analytics", requireAuth, async (req: any, res) => {
    try {
      const restaurantId = Number(req.params.id);
      const days = req.query.days ? Number(req.query.days) : 30;
      
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has permission
      const userId = req.user.id;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Get comprehensive analytics data
      const analytics = await storage.getAnalytics(restaurantId, days);
      const mostViewedItems = await storage.getMostViewedMenuItems(restaurantId, days);
      const languageStats = await storage.getMenuLanguageStats(restaurantId, days);
      
      const analyticsData = {
        basicStats: analytics,
        mostViewedItems,
        languageStats,
        totalViews: analytics.reduce((sum, day) => sum + (day.visits || 0), 0),
        totalQrScans: analytics.reduce((sum, day) => sum + (day.qrScans || 0), 0)
      };
      
      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });



  // Track menu item view
  app.post("/api/restaurants/:id/track-view", async (req, res) => {
    try {
      const restaurantId = Number(req.params.id);
      const { menuItemId, language, userAgent } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Track menu item view
      if (menuItemId) {
        await storage.trackMenuItemView({
          menuItemId: Number(menuItemId),
          restaurantId,
          viewerLanguage: language || 'it',
          userAgent,
          ipAddress: ipAddress?.substring(0, 45) // Limit IP length for database
        });
      }
      
      // Track language usage
      if (language) {
        await storage.trackLanguageUsage(restaurantId, language);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking view:", error);
      res.status(500).json({ message: "Failed to track view" });
    }
  });

  // Public view route that tracks visits
  app.get("/api/view/:subdomain", async (req, res) => {
    try {
      const subdomain = req.params.subdomain;
      const restaurant = await storage.getRestaurantBySubdomain(subdomain);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Track visit
      await storage.incrementVisits(restaurant.id);
      
      // Get all menu data for the restaurant
      const categories = await storage.getCategories(restaurant.id);
      
      // Get menu items for each category
      const categoriesWithItems = await Promise.all(
        categories.map(async (category) => {
          const items = await storage.getMenuItems(category.id);
          
          // Get allergens for each menu item
          const itemsWithAllergens = await Promise.all(
            items.map(async (item) => {
              const allergens = await storage.getMenuItemAllergens(item.id);
              return { ...item, allergens };
            })
          );
          
          return { ...category, items: itemsWithAllergens };
        })
      );
      
      const template = await storage.getTemplate(restaurant.templateId || 1);
      
      res.json({
        restaurant,
        template,
        categories: categoriesWithItems,
      });
    } catch (error) {
      console.error("Error viewing restaurant menu:", error);
      res.status(500).json({ message: "Failed to load restaurant menu" });
    }
  });

  // QR scan tracking route
  app.get("/api/scan/:subdomain", async (req, res) => {
    try {
      const subdomain = req.params.subdomain;
      const restaurant = await storage.getRestaurantBySubdomain(subdomain);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Track QR scan
      await storage.incrementQrScans(restaurant.id);
      
      // Redirect to the menu
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking QR scan:", error);
      res.status(500).json({ message: "Failed to track QR scan" });
    }
  });

  // Maintenance mode routes (admin only)
  app.get("/api/admin/maintenance", requireAdmin, async (req, res) => {
    try {
      // Check if maintenance mode is enabled (you can store this in database or environment variable)
      const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
      res.json({ maintenanceMode });
    } catch (error) {
      console.error("Error checking maintenance mode:", error);
      res.status(500).json({ message: "Failed to check maintenance mode" });
    }
  });

  app.post("/api/admin/maintenance/toggle", requireAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      // In a real application, you might want to store this in the database
      // For now, we'll use environment variables
      process.env.MAINTENANCE_MODE = enabled ? 'true' : 'false';
      res.json({ maintenanceMode: enabled });
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      res.status(500).json({ message: "Failed to toggle maintenance mode" });
    }
  });

  // File upload route
  app.post("/api/upload", requireAuth, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const filename = req.file.filename;
      const filepath = req.file.path;
      
      // Optimize image
      const optimizedPath = path.join(uploadDir, `optimized-${filename}`);
      
      await sharp(filepath)
        .resize(800) // Max width
        .jpeg({ quality: 80 })
        .toFile(optimizedPath);
      
      // Delete original file
      fs.unlinkSync(filepath);
      
      // Create URL path
      const basePath = `/uploads/optimized-${filename}`;
      
      res.json({
        url: basePath,
        message: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Client invitation routes (admin only)
  app.get("/api/client-invitations", requireAdmin, async (req, res) => {
    try {
      const invitations = await storage.getClientInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/client-invitations", requireAdmin, async (req: any, res) => {
    try {
      // Extract and validate only the required fields
      const { email, restaurantName } = req.body;
      
      if (!email || !restaurantName) {
        return res.status(400).json({ message: "Email e nome ristorante sono obbligatori" });
      }
      
      // Set expiry date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const invitationData = {
        email,
        restaurantName,
        invitedBy: req.user.id,
        expiresAt,
      };
      
      const invitation = await storage.createClientInvitation(invitationData);
      
      // Generate invite link
      const inviteLink = `${req.protocol}://${req.get('host')}/invite?code=${invitation.inviteCode}`;
      
      // Send invitation email automatically
      const emailSent = await sendInviteEmail({
        to: invitation.email,
        restaurantName: invitation.restaurantName,
        inviteLink: inviteLink
      });
      
      if (!emailSent) {
        console.warn(`Failed to send invitation email to ${invitation.email}, but invitation was created`);
      }
      
      res.status(201).json({
        ...invitation,
        emailSent
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Verify invitation by code
  app.get("/api/client-invitations/verify/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const invitation = await storage.getClientInvitationByCode(code);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Failed to verify invitation" });
    }
  });

  // Accept invitation (temporarily without authentication)
  app.post("/api/client-invitations/accept", async (req: any, res) => {
    try {
      const { inviteCode, userEmail, password } = req.body;
      
      // For now, create a temporary user ID based on email
      // In production, this would use the authenticated user's ID
      const userId = userEmail || `temp_${Date.now()}`;
      
      if (!inviteCode) {
        return res.status(400).json({ message: "Invite code is required" });
      }
      
      const invitation = await storage.getClientInvitationByCode(inviteCode);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.usedAt) {
        return res.status(400).json({ message: "Invitation already used" });
      }
      
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Invitation expired" });
      }
      
      // First, create or get the user
      console.log('Creating user with ID:', userId, 'and email:', userEmail);
      let user = await storage.getUser(userId);
      console.log('Existing user found:', user);
      
      if (!user) {
        console.log('Creating new user...');
        const hashedPassword = await hashPassword(password);
        user = await storage.upsertUser({
          id: userId,
          email: userEmail,
          password: hashedPassword,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
        });
        console.log('User created:', user);
      }

      // Create restaurant for the user
      const baseSubdomain = generateSubdomain(invitation.restaurantName);
      const availableSubdomain = await findAvailableSubdomain(baseSubdomain);
      
      const restaurantData = {
        name: invitation.restaurantName,
        subdomain: availableSubdomain,
        location: "Da configurare",
        description: `Menu digitale per ${invitation.restaurantName}`,
        ownerId: user.id,
      };
      
      const restaurant = await storage.createRestaurant(restaurantData);
      
      // Create Cloudflare DNS record for the subdomain
      const subdomainCreated = await createSubdomain(availableSubdomain);
      if (!subdomainCreated) {
        console.warn(`Failed to create subdomain for restaurant ${restaurant.id} - continuing without DNS record`);
      }
      
      // Mark invitation as used
      await storage.updateClientInvitation(invitation.id, { status: "accepted" });
      
      // Send welcome email with menu URL
      const menuUrl = `https://${availableSubdomain}.menuisland.it`;
      const welcomeEmailSent = await sendWelcomeEmail(
        invitation.email,
        invitation.restaurantName,
        menuUrl
      );
      
      if (!welcomeEmailSent) {
        console.warn(`Failed to send welcome email to ${invitation.email}`);
      }
      
      res.json({ 
        message: "Invitation accepted successfully",
        restaurant,
        menuUrl,
        emailSent: welcomeEmailSent
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  app.delete("/api/client-invitations/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteClientInvitation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // STRIPE PAYMENT ENDPOINTS
  
  // Get Stripe public key
  app.get("/api/stripe-config", (_req, res) => {
    const publicKey = process.env.VITE_STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ message: "Stripe public key not configured" });
    }
    res.json({ publicKey });
  });

  // Create payment intent for €349 one-time payment
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.hasPaid) {
        return res.status(400).json({ message: "User has already paid" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 34900, // €349 in cents
        currency: 'eur',
        metadata: {
          userId: user.id,
          userEmail: user.email || '',
        },
      });

      // Update user with payment intent ID
      await storage.updateUserPaymentInfo(user.id, {
        stripePaymentIntentId: paymentIntent.id,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Confirm payment after successful Stripe transaction
  app.post("/api/confirm-payment", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = (req as any).user?.id;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID required" });
      }

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.userId === userId) {
        // Update user payment status
        await storage.updateUserPaymentInfo(userId, {
          hasPaid: true,
          paymentDate: new Date(),
        });

        res.json({ success: true, message: "Payment confirmed" });
      } else {
        res.status(400).json({ message: "Payment not successful" });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // ADMIN ENDPOINTS

  // Get all users (admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get payment statistics (admin only)
  app.get("/api/admin/payment-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getPaymentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ message: "Failed to fetch payment stats" });
    }
  });

  // Toggle user payment status (admin only)
  app.patch("/api/admin/users/:userId/payment", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { hasPaid } = req.body;

      await storage.updateUserPaymentInfo(userId, {
        hasPaid,
        paymentDate: hasPaid ? new Date() : null,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });



  // Update user's restaurant limit (admin only)
  app.patch("/api/admin/users/:userId/max-restaurants", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { maxRestaurants } = req.body;
      
      if (!maxRestaurants || maxRestaurants < 1) {
        return res.status(400).json({ message: "Il numero massimo di ristoranti deve essere almeno 1" });
      }
      
      const updatedUser = await storage.updateUserMaxRestaurants(userId, maxRestaurants);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user restaurant limit:", error);
      res.status(500).json({ message: "Failed to update restaurant limit" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user?.id;
      
      // Prevent admin from deleting themselves
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Create database backup (admin only)
  app.post("/api/admin/backup", requireAdmin, async (req, res) => {
    try {
      const { Pool } = require('pg');
      const fs = require('fs');
      const path = require('path');
      
      const backupFileName = `menuisland-backup-${new Date().toISOString().split('T')[0]}.json`;
      const backupPath = path.join(process.cwd(), backupFileName);
      
      // Get all data from database
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      const tables = [
        'users', 'restaurants', 'categories', 'menu_items', 
        'allergens', 'menu_item_allergens', 'qr_codes', 
        'analytics', 'menu_item_views', 'menu_language_usage',
        'client_invitations', 'templates'
      ];
      
      const backup: any = {};
      
      for (const table of tables) {
        try {
          const result = await pool.query(`SELECT * FROM ${table}`);
          backup[table] = result.rows;
        } catch (err) {
          console.warn(`Table ${table} not found or error:`, err);
          backup[table] = [];
        }
      }
      
      // Write backup to file
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
      
      // Send the backup file
      res.download(backupPath, backupFileName, (err) => {
        if (err) {
          console.error("Download error:", err);
          return res.status(500).json({ message: "Failed to download backup" });
        }
        
        // Clean up the backup file after download
        fs.unlink(backupPath, (unlinkErr: any) => {
          if (unlinkErr) console.error("Failed to clean up backup file:", unlinkErr);
        });
      });
      
      await pool.end();
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // System statistics endpoint (admin only)
  app.get("/api/admin/system-stats", requireAdmin, async (req, res) => {
    try {
      const totalRestaurants = (await storage.getRestaurants()).length;
      const totalMenuItems = await storage.getTotalMenuItems() || 0;
      const totalVisits = await storage.getTotalVisits() || 0;
      const totalQrScans = await storage.getTotalQrScans() || 0;
      
      // System metrics
      const uptime = process.uptime();
      const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
      const memoryUsage = Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100);
      
      res.json({
        totalRestaurants,
        totalMenuItems,
        totalVisits,
        totalQrScans,
        uptime: uptimeString,
        memoryUsage,
        diskUsage: 45 // Placeholder - would need system-specific implementation
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  // Get all restaurants with owner info (admin only)
  app.get("/api/admin/restaurants", requireAdmin, async (req, res) => {
    try {
      const restaurants = await storage.getRestaurants();
      const restaurantsWithOwners = await Promise.all(
        restaurants.map(async (restaurant) => {
          const owner = restaurant.ownerId ? await storage.getUser(restaurant.ownerId) : null;
          return {
            ...restaurant,
            ownerEmail: owner?.email || 'Unknown'
          };
        })
      );
      res.json(restaurantsWithOwners);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  // Toggle admin status (admin only)
  app.put("/api/admin/users/:userId/toggle-admin", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;
      
      await storage.updateUserAdminStatus(userId, isAdmin);
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  // Update user max restaurants (admin only)
  app.put("/api/admin/users/:userId/max-restaurants", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { maxRestaurants } = req.body;
      
      await storage.updateUserMaxRestaurants(userId, maxRestaurants);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating max restaurants:", error);
      res.status(500).json({ message: "Failed to update max restaurants" });
    }
  });

  // Force payment for user (admin only)
  app.post("/api/admin/users/:userId/force-payment", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      await storage.updateUserPaymentInfo(userId, {
        hasPaid: true,
        paymentDate: new Date(),
        stripePaymentIntentId: 'admin_forced_payment'
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error forcing payment:", error);
      res.status(500).json({ message: "Failed to force payment" });
    }
  });

  // Create database backup (admin only)
  app.post("/api/admin/backup", requireAdmin, async (req, res) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.sql`;
      
      // In a real implementation, you would create an actual database dump
      // For now, we simulate the backup creation
      res.json({ 
        success: true, 
        filename,
        message: "Backup created successfully" 
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // Email template management endpoints (admin only)
  app.get("/api/admin/email-templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.get("/api/admin/email-templates/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getEmailTemplate(parseInt(id));
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ message: "Failed to fetch email template" });
    }
  });

  app.post("/api/admin/email-templates", requireAdmin, async (req, res) => {
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.put("/api/admin/email-templates/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateEmailTemplate(parseInt(id), req.body);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.delete("/api/admin/email-templates/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEmailTemplate(parseInt(id));
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  // Send email using template (admin only)
  app.post("/api/admin/send-email", requireAdmin, async (req, res) => {
    try {
      const { to, subject, message, templateId, variables } = req.body;
      
      let emailContent = message;
      let emailSubject = subject;

      // If using a template, get it and replace variables
      if (templateId) {
        const template = await storage.getEmailTemplate(templateId);
        if (!template) {
          return res.status(404).json({ message: "Template not found" });
        }
        
        emailContent = template.htmlContent;
        emailSubject = template.subject;

        // Replace variables in content and subject
        if (variables) {
          Object.keys(variables).forEach(key => {
            const value = variables[key];
            emailContent = emailContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
            emailSubject = emailSubject.replace(new RegExp(`{{${key}}}`, 'g'), value);
          });
        }
      }
      
      if (!to || !emailSubject || !emailContent) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Use the email service with processed content
      const { sendAdminSupportEmail } = await import('./emailService');
      const emailSent = await sendAdminSupportEmail(to, emailSubject, emailContent);
      
      if (emailSent) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Create the server
  const httpServer = createServer(app);
  
  // Download endpoint for project zip
  app.get('/download', (req, res) => {
    const filePath = path.join(process.cwd(), 'menumaster-complete.zip');
    res.download(filePath, 'menumaster-complete.zip', (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(404).send('File not found');
      }
    });
  });

  // Download page
  app.get('/download-page', (req, res) => {
    const downloadPagePath = path.join(process.cwd(), 'download.html');
    res.sendFile(downloadPagePath);
  });

  // Initialize additional templates on startup
  initializeAdditionalTemplates();

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));
  
  return httpServer;
}

// Function to initialize additional restaurant templates and email templates
async function initializeAdditionalTemplates() {
  try {
    const existingTemplates = await storage.getTemplates();
    
    // Only add templates if there are less than 5 in total
    if (existingTemplates.length < 5) {
      const newTemplates = [
        {
          name: "Template Elegante",
          description: "Design raffinato con tipografia elegante e layout pulito",
          colorScheme: {
            primary: "#2C3E50",
            secondary: "#E8F4FD",
            accent: "#3498DB",
            text: "#2C3E50",
            background: "#FFFFFF"
          },
          cssStyles: `
            .restaurant-header { background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%); }
            .menu-category { border-left: 4px solid #3498DB; background: #E8F4FD; }
            .menu-item { border-bottom: 1px solid #E8F4FD; padding: 1rem; }
            .menu-item:hover { background: #F8FBFF; }
            .price { color: #2C3E50; font-weight: bold; }
          `,
          isPopular: true,
          isNew: false
        },
        {
          name: "Template Rustico",
          description: "Stile caldo e accogliente con tonalità terrose",
          colorScheme: {
            primary: "#8B4513",
            secondary: "#F5DEB3",
            accent: "#CD853F",
            text: "#5D4037",
            background: "#FFF8E1"
          },
          cssStyles: `
            .restaurant-header { background: linear-gradient(135deg, #8B4513 0%, #CD853F 100%); }
            .menu-category { background: #F5DEB3; border: 2px solid #CD853F; border-radius: 8px; }
            .menu-item { background: #FFF8E1; margin: 0.5rem 0; border-radius: 6px; padding: 1rem; }
            .menu-item:hover { background: #F5DEB3; }
            .price { color: #8B4513; font-weight: bold; }
          `,
          isPopular: false,
          isNew: true
        },
        {
          name: "Template Marino",
          description: "Colori del mare per ristoranti di pesce",
          colorScheme: {
            primary: "#0077BE",
            secondary: "#B3E5FC",
            accent: "#00ACC1",
            text: "#01579B",
            background: "#E1F5FE"
          },
          cssStyles: `
            .restaurant-header { background: linear-gradient(135deg, #0077BE 0%, #00ACC1 100%); }
            .menu-category { background: #B3E5FC; border-radius: 12px; }
            .menu-item { background: white; margin: 0.5rem 0; box-shadow: 0 2px 4px rgba(0,119,190,0.1); border-radius: 8px; padding: 1rem; }
            .menu-item:hover { box-shadow: 0 4px 8px rgba(0,119,190,0.2); }
            .price { color: #0077BE; font-weight: bold; }
          `,
          isPopular: true,
          isNew: false
        },
        {
          name: "Template Vintage",
          description: "Stile retrò con carattere classico",
          colorScheme: {
            primary: "#704214",
            secondary: "#F4F1E8",
            accent: "#D4AF37",
            text: "#3E2723",
            background: "#FAF8F3"
          },
          cssStyles: `
            .restaurant-header { background: linear-gradient(135deg, #704214 0%, #D4AF37 100%); font-family: serif; }
            .menu-category { background: #F4F1E8; border: 1px solid #D4AF37; font-family: serif; }
            .menu-item { background: #FAF8F3; border-bottom: 1px dotted #D4AF37; padding: 1.2rem; font-family: serif; }
            .menu-item:hover { background: #F4F1E8; }
            .price { color: #704214; font-weight: bold; font-family: serif; }
          `,
          isPopular: false,
          isNew: true
        }
      ];

      for (const template of newTemplates) {
        await storage.createTemplate(template);
      }
      
      console.log("Additional templates initialized successfully");
    }

    // Initialize email templates if they don't exist
    const existingEmailTemplates = await storage.getEmailTemplates();
    
    if (existingEmailTemplates.length === 0) {
      const emailTemplates = [
        {
          type: "welcome" as const,
          name: "Benvenuto su MenuIsland",
          subject: "Benvenuto su MenuIsland - Il tuo account è stato creato!",
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2C3E50;">Benvenuto su MenuIsland!</h1>
                <p>Ciao <strong>{{name}}</strong>,</p>
                <p>Il tuo account è stato creato con successo. Ora puoi iniziare a creare i tuoi menu digitali.</p>
                <p>Per completare la configurazione del tuo account, ricorda di effettuare il pagamento di €349.</p>
                <p>Cordiali saluti,<br>Il team di MenuIsland</p>
              </body>
            </html>
          `,
          textContent: "Benvenuto su MenuIsland! Il tuo account è stato creato con successo.",
          variables: ["name"],
          isActive: true
        },
        {
          type: "support" as const,
          name: "Template Supporto Tecnico",
          subject: "Richiesta di supporto - MenuIsland",
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2C3E50;">Supporto Tecnico MenuIsland</h1>
                <p>Ciao <strong>{{name}}</strong>,</p>
                <p>{{supportMessage}}</p>
                <p>Se hai bisogno di ulteriore assistenza, non esitare a contattarci.</p>
                <p>Cordiali saluti,<br>Il team di supporto MenuIsland</p>
              </body>
            </html>
          `,
          textContent: "Supporto tecnico MenuIsland",
          variables: ["name", "supportMessage"],
          isActive: true
        },
        {
          type: "payment_confirmation" as const,
          name: "Conferma Pagamento",
          subject: "Pagamento confermato - MenuIsland",
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #27AE60;">Pagamento Confermato!</h1>
                <p>Ciao <strong>{{name}}</strong>,</p>
                <p>Il tuo pagamento di €349 è stato confermato con successo.</p>
                <p>Ora puoi accedere a tutte le funzionalità di MenuIsland e creare i tuoi menu digitali.</p>
                <p>Cordiali saluti,<br>Il team di MenuIsland</p>
              </body>
            </html>
          `,
          textContent: "Il tuo pagamento di €349 è stato confermato con successo.",
          variables: ["name"],
          isActive: true
        }
      ];

      for (const template of emailTemplates) {
        await storage.createEmailTemplate(template);
      }
      
      console.log("Email templates initialized successfully");
    }
  } catch (error) {
    console.error("Error initializing additional templates:", error);
  }
}
