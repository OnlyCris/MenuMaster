import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendInviteEmail, sendWelcomeEmail } from "./emailService";
import { createSubdomain, deleteSubdomain, generateSubdomain, findAvailableSubdomain } from "./cloudflareService";
import { insertTemplateSchema } from "../shared/schema";
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

// Helper function for checking if user is admin
async function isAdmin(req: Request): Promise<boolean> {
  const userId = req.user?.claims?.sub;
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
  await setupAuth(app);
  
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
            
          // Prepare menu data with items and allergens
          const menuData = {
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
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Restaurant routes
  app.get("/api/restaurants", isAuthenticated, async (req: any, res) => {
    try {
      let restaurants;
      
      if (await isAdmin(req)) {
        // Admin sees all restaurants
        restaurants = await storage.getRestaurants();
      } else {
        // Regular users see only their restaurants
        const userId = req.user.claims.sub;
        restaurants = await storage.getRestaurantsByOwner(userId);
      }
      
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/restaurants", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      
      // Generate subdomain for the restaurant
      const baseSubdomain = generateSubdomain(validatedData.name);
      const availableSubdomain = await findAvailableSubdomain(baseSubdomain);
      
      // Associate the restaurant with the current user
      const userId = req.user.claims.sub;
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

  app.put("/api/restaurants/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has permission (admin or owner)
      const userId = req.user.claims.sub;
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

  app.delete("/api/restaurants/:id", isAuthenticated, adminOnly, async (req, res) => {
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
  app.get("/api/templates", isAuthenticated, async (_req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", isAuthenticated, async (req, res) => {
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
  
  app.post("/api/templates", isAuthenticated, async (req: any, res) => {
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
  
  app.put("/api/templates/:id", isAuthenticated, async (req, res) => {
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
  
  app.delete("/api/templates/:id", isAuthenticated, adminOnly, async (req, res) => {
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

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      
      // Check if user has permission to add to this restaurant
      const restaurant = await storage.getRestaurant(validatedData.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.claims.sub;
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

  app.put("/api/categories/:id", isAuthenticated, async (req: any, res) => {
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
      
      const userId = req.user.claims.sub;
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

  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
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
      
      const userId = req.user.claims.sub;
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

  app.post("/api/menu-items", isAuthenticated, async (req: any, res) => {
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
      
      const userId = req.user.claims.sub;
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

  app.post("/api/menu-items/:id/allergens/:allergenId", isAuthenticated, async (req: any, res) => {
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
      
      const userId = req.user.claims.sub;
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

  app.delete("/api/menu-items/:id/allergens/:allergenId", isAuthenticated, async (req: any, res) => {
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
      
      const userId = req.user.claims.sub;
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

  app.put("/api/menu-items/:id", isAuthenticated, async (req: any, res) => {
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
      
      const userId = req.user.claims.sub;
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

  app.delete("/api/menu-items/:id", isAuthenticated, async (req: any, res) => {
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
      
      const userId = req.user.claims.sub;
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

  app.post("/api/allergens", isAuthenticated, async (req, res) => {
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

  app.put("/api/allergens/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/allergens/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/restaurants/:id/qr-codes", isAuthenticated, async (req: any, res) => {
    try {
      const restaurantId = Number(req.params.id);
      const restaurant = await storage.getRestaurant(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has permission
      const userId = req.user.claims.sub;
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

  app.post("/api/qr-codes", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertQrCodeSchema.parse(req.body);
      
      // Check if user has permission
      const restaurant = await storage.getRestaurant(validatedData.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const userId = req.user.claims.sub;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Generate QR code
      const qrUrl = `https://${restaurant.subdomain}.menumaster.com`;
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

  app.delete("/api/qr-codes/:id", isAuthenticated, async (req: any, res) => {
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

  // Analytics routes
  app.get("/api/restaurants/:id/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const restaurantId = Number(req.params.id);
      const days = req.query.days ? Number(req.query.days) : 30;
      
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has permission
      const userId = req.user.claims.sub;
      const isUserAdmin = await isAdmin(req);
      
      if (!isUserAdmin && restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const analytics = await storage.getAnalytics(restaurantId, days);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
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

  // File upload route
  app.post("/api/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
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

  // Client invitation routes
  app.get("/api/client-invitations", isAuthenticated, async (req, res) => {
    try {
      const invitations = await storage.getClientInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/client-invitations", isAuthenticated, async (req: any, res) => {
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
        invitedBy: req.user.claims.sub,
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
      const { inviteCode, userEmail } = req.body;
      
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
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: userEmail,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
        });
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
        console.warn(`Failed to create subdomain for restaurant ${restaurant.id}`);
      }
      
      // Mark invitation as used
      await storage.updateClientInvitation(invitation.id, { usedAt: new Date() });
      
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

  app.delete("/api/client-invitations/:id", isAuthenticated, async (req, res) => {
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

  // Create the server
  const httpServer = createServer(app);
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));
  
  return httpServer;
}
