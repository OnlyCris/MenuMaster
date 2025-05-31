import {
  users,
  restaurants,
  templates,
  categories,
  menuItems,
  allergens,
  menuItemAllergens,
  qrCodes,
  analytics,
  clientInvitations,
  type User,
  type UpsertUser,
  type Restaurant,
  type InsertRestaurant,
  type Template,
  type InsertTemplate,
  type Category,
  type InsertCategory,
  type MenuItem,
  type InsertMenuItem,
  type Allergen,
  type InsertAllergen,
  type QrCode,
  type InsertQrCode,
  type Analytics,
  type ClientInvitation,
  type InsertClientInvitation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, sql, asc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin and payment operations
  getAllUsers(): Promise<User[]>;
  updateUserProfile(id: string, profile: { firstName?: string; lastName?: string; email?: string }): Promise<User>;
  updateUserPaymentInfo(id: string, paymentInfo: { hasPaid?: boolean; paymentDate?: Date | null; stripePaymentIntentId?: string; stripeCustomerId?: string }): Promise<void>;
  getPaymentStats(): Promise<{ totalUsers: number; paidUsers: number; activeUsers: number }>;
  deleteUser(id: string): Promise<void>;
  
  // Restaurant operations
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantBySubdomain(subdomain: string): Promise<Restaurant | undefined>;
  getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<boolean>;
  
  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  
  // Category operations
  getCategories(restaurantId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Menu Item operations
  getMenuItems(categoryId: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  // Allergen operations
  getAllergens(): Promise<Allergen[]>;
  getAllergen(id: number): Promise<Allergen | undefined>;
  getMenuItemAllergens(menuItemId: number): Promise<Allergen[]>;
  createAllergen(allergen: InsertAllergen): Promise<Allergen>;
  updateAllergen(id: number, allergen: Partial<InsertAllergen>): Promise<Allergen | undefined>;
  deleteAllergen(id: number): Promise<boolean>;
  addAllergenToMenuItem(menuItemId: number, allergenId: number): Promise<void>;
  removeAllergenFromMenuItem(menuItemId: number, allergenId: number): Promise<void>;
  
  // QR Code operations
  getQrCodes(restaurantId: number): Promise<QrCode[]>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  deleteQrCode(id: number): Promise<boolean>;
  
  // Analytics operations
  getAnalytics(restaurantId: number, days?: number): Promise<Analytics[]>;
  incrementVisits(restaurantId: number): Promise<void>;
  incrementQrScans(restaurantId: number): Promise<void>;
  
  // Client invitation operations
  getClientInvitations(): Promise<ClientInvitation[]>;
  getClientInvitation(id: number): Promise<ClientInvitation | undefined>;
  getClientInvitationByCode(code: string): Promise<ClientInvitation | undefined>;
  createClientInvitation(invitation: InsertClientInvitation): Promise<ClientInvitation>;
  updateClientInvitation(id: number, invitation: Partial<InsertClientInvitation>): Promise<ClientInvitation | undefined>;
  deleteClientInvitation(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, profile: { firstName?: string; lastName?: string; email?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Restaurant operations
  async getRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants).orderBy(restaurants.name);
  }
  
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }
  
  async getRestaurantBySubdomain(subdomain: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.subdomain, subdomain));
    return restaurant;
  }
  
  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    return await db.select().from(restaurants).where(eq(restaurants.ownerId, ownerId)).orderBy(restaurants.name);
  }
  
  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db.insert(restaurants).values(restaurant).returning();
    return newRestaurant;
  }
  
  async updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set({ ...restaurant, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
    return updatedRestaurant;
  }
  
  async deleteRestaurant(id: number): Promise<boolean> {
    const result = await db.delete(restaurants).where(eq(restaurants.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Template operations
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(templates.name);
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }
  
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }
  
  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [updatedTemplate] = await db
      .update(templates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return updatedTemplate;
  }
  
  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Category operations
  async getCategories(restaurantId: number): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, restaurantId))
      .orderBy(categories.order);
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Menu Item operations
  async getMenuItems(categoryId: number): Promise<MenuItem[]> {
    return await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(menuItems.order);
  }
  
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }
  
  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const [newMenuItem] = await db.insert(menuItems).values(menuItem).returning();
    return newMenuItem;
  }
  
  async updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updatedMenuItem] = await db
      .update(menuItems)
      .set({ ...menuItem, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    return updatedMenuItem;
  }
  
  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return result.count > 0;
  }
  
  // Allergen operations
  async getAllergens(): Promise<Allergen[]> {
    return await db.select().from(allergens).orderBy(allergens.name);
  }
  
  async getAllergen(id: number): Promise<Allergen | undefined> {
    const [allergen] = await db.select().from(allergens).where(eq(allergens.id, id));
    return allergen;
  }
  
  async getMenuItemAllergens(menuItemId: number): Promise<Allergen[]> {
    const result = await db
      .select({
        id: allergens.id,
        name: allergens.name,
        icon: allergens.icon,
        description: allergens.description,
        createdAt: allergens.createdAt,
        updatedAt: allergens.updatedAt,
      })
      .from(allergens)
      .innerJoin(
        menuItemAllergens,
        and(
          eq(menuItemAllergens.allergenId, allergens.id),
          eq(menuItemAllergens.menuItemId, menuItemId)
        )
      );
    return result;
  }
  
  async createAllergen(allergen: InsertAllergen): Promise<Allergen> {
    const [newAllergen] = await db.insert(allergens).values(allergen).returning();
    return newAllergen;
  }
  
  async updateAllergen(id: number, allergen: Partial<InsertAllergen>): Promise<Allergen | undefined> {
    const [updatedAllergen] = await db
      .update(allergens)
      .set({ ...allergen, updatedAt: new Date() })
      .where(eq(allergens.id, id))
      .returning();
    return updatedAllergen;
  }
  
  async deleteAllergen(id: number): Promise<boolean> {
    const result = await db.delete(allergens).where(eq(allergens.id, id));
    return result.count > 0;
  }
  
  async addAllergenToMenuItem(menuItemId: number, allergenId: number): Promise<void> {
    await db
      .insert(menuItemAllergens)
      .values({ menuItemId, allergenId })
      .onConflictDoNothing();
  }
  
  async removeAllergenFromMenuItem(menuItemId: number, allergenId: number): Promise<void> {
    await db
      .delete(menuItemAllergens)
      .where(
        and(
          eq(menuItemAllergens.menuItemId, menuItemId),
          eq(menuItemAllergens.allergenId, allergenId)
        )
      );
  }
  
  // QR Code operations
  async getQrCodes(restaurantId: number): Promise<QrCode[]> {
    return await db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.restaurantId, restaurantId))
      .orderBy(desc(qrCodes.createdAt));
  }
  
  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    const [newQrCode] = await db.insert(qrCodes).values(qrCode).returning();
    return newQrCode;
  }
  
  async deleteQrCode(id: number): Promise<boolean> {
    const result = await db.delete(qrCodes).where(eq(qrCodes.id, id));
    return result.count > 0;
  }
  
  // Analytics operations
  async getAnalytics(restaurantId: number, days = 30): Promise<Analytics[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return await db
      .select()
      .from(analytics)
      .where(
        and(
          eq(analytics.restaurantId, restaurantId),
          sql`${analytics.date} >= ${date}`
        )
      )
      .orderBy(asc(analytics.date));
  }
  
  async incrementVisits(restaurantId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existing] = await db
      .select()
      .from(analytics)
      .where(
        and(
          eq(analytics.restaurantId, restaurantId),
          sql`DATE(${analytics.date}) = DATE(${today})`
        )
      );
    
    if (existing) {
      await db
        .update(analytics)
        .set({ visits: sql`${analytics.visits} + 1` })
        .where(eq(analytics.id, existing.id));
    } else {
      await db
        .insert(analytics)
        .values({
          restaurantId,
          visits: 1,
          qrScans: 0,
          date: today,
        });
    }
  }
  
  async incrementQrScans(restaurantId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existing] = await db
      .select()
      .from(analytics)
      .where(
        and(
          eq(analytics.restaurantId, restaurantId),
          sql`DATE(${analytics.date}) = DATE(${today})`
        )
      );
    
    if (existing) {
      await db
        .update(analytics)
        .set({ qrScans: sql`${analytics.qrScans} + 1` })
        .where(eq(analytics.id, existing.id));
    } else {
      await db
        .insert(analytics)
        .values({
          restaurantId,
          visits: 0,
          qrScans: 1,
          date: today,
        });
    }
  }

  // Client invitation operations
  async getClientInvitations(): Promise<ClientInvitation[]> {
    return await db.select().from(clientInvitations).orderBy(desc(clientInvitations.createdAt));
  }

  async getClientInvitation(id: number): Promise<ClientInvitation | undefined> {
    const [invitation] = await db.select().from(clientInvitations).where(eq(clientInvitations.id, id));
    return invitation;
  }

  async getClientInvitationByCode(code: string): Promise<ClientInvitation | undefined> {
    const [invitation] = await db.select().from(clientInvitations).where(eq(clientInvitations.inviteCode, code));
    return invitation;
  }

  async createClientInvitation(invitation: InsertClientInvitation): Promise<ClientInvitation> {
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const [newInvitation] = await db
      .insert(clientInvitations)
      .values({
        email: invitation.email,
        restaurantName: invitation.restaurantName,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        inviteCode,
      })
      .returning();
    return newInvitation;
  }

  async updateClientInvitation(id: number, invitation: Partial<InsertClientInvitation>): Promise<ClientInvitation | undefined> {
    const [updatedInvitation] = await db
      .update(clientInvitations)
      .set(invitation)
      .where(eq(clientInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async deleteClientInvitation(id: number): Promise<boolean> {
    const result = await db.delete(clientInvitations).where(eq(clientInvitations.id, id));
    return result.rowCount > 0;
  }

  // Admin and payment operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserPaymentInfo(id: string, paymentInfo: { 
    hasPaid?: boolean; 
    paymentDate?: Date | null; 
    stripePaymentIntentId?: string; 
    stripeCustomerId?: string; 
  }): Promise<void> {
    await db
      .update(users)
      .set({ 
        ...paymentInfo, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async getPaymentStats(): Promise<{ totalUsers: number; paidUsers: number; activeUsers: number }> {
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const paidUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.hasPaid, true));
    
    const totalUsers = totalUsersResult[0]?.count || 0;
    const paidUsers = paidUsersResult[0]?.count || 0;
    
    return {
      totalUsers,
      paidUsers,
      activeUsers: paidUsers, // For now, active users = paid users
    };
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();
