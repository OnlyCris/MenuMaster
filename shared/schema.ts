import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  serial,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  role: varchar("role").default("user"), // "admin", "user", "restaurant_owner"
  hasPaid: boolean("has_paid").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client invitations table
export const clientInvitations = pgTable("client_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  restaurantName: varchar("restaurant_name").notNull(),
  inviteCode: varchar("invite_code").notNull().unique(),
  status: varchar("status").notNull().default("pending"), // "pending", "accepted", "expired"
  invitedBy: varchar("invited_by").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Restaurant table
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  subdomain: text("subdomain").notNull().unique(),
  logoUrl: text("logo_url"),
  ownerId: varchar("owner_id").references(() => users.id),
  templateId: integer("template_id").references(() => templates.id),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Template table
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  cssStyles: text("css_styles"),
  colorScheme: jsonb("color_scheme"), // Stores customizable colors
  isPopular: boolean("is_popular").default(false),
  isNew: boolean("is_new").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Restaurant template customizations
export const restaurantTemplateCustomizations = pgTable("restaurant_template_customizations", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  templateId: integer("template_id").notNull().references(() => templates.id),
  customColors: jsonb("custom_colors"), // User's custom color palette
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu Items table
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Allergens table
export const allergens = pgTable("allergens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table for menu items and allergens (many-to-many)
export const menuItemAllergens = pgTable("menu_item_allergens", {
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  allergenId: integer("allergen_id").references(() => allergens.id).notNull(),
}, (table) => ({
  pk: primaryKey(table.menuItemId, table.allergenId),
}));

// QR Codes table
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  qrData: text("qr_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics table
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  visits: integer("visits").default(0),
  qrScans: integer("qr_scans").default(0),
  date: timestamp("date").defaultNow(),
});

// Menu Item Views (for tracking most viewed items)
export const menuItemViews = pgTable("menu_item_views", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  viewerLanguage: text("viewer_language").default("it"),
  viewedAt: timestamp("viewed_at").defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

// Menu Language Usage
export const menuLanguageUsage = pgTable("menu_language_usage", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  language: text("language").notNull(),
  viewCount: integer("view_count").default(1),
  lastUsed: timestamp("last_used").defaultNow(),
});

// Define Relations
export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [restaurants.templateId],
    references: [templates.id],
  }),
  categories: many(categories),
  qrCodes: many(qrCodes),
  analytics: many(analytics),
  menuItemViews: many(menuItemViews),
  languageUsage: many(menuLanguageUsage),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  allergens: many(menuItemAllergens),
  views: many(menuItemViews),
}));

export const allergensRelations = relations(allergens, ({ many }) => ({
  menuItems: many(menuItemAllergens),
}));

export const menuItemAllergensRelations = relations(menuItemAllergens, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemAllergens.menuItemId],
    references: [menuItems.id],
  }),
  allergen: one(allergens, {
    fields: [menuItemAllergens.allergenId],
    references: [allergens.id],
  }),
}));

export const restaurantTemplateCustomizationsRelations = relations(restaurantTemplateCustomizations, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantTemplateCustomizations.restaurantId],
    references: [restaurants.id],
  }),
  template: one(templates, {
    fields: [restaurantTemplateCustomizations.templateId],
    references: [templates.id],
  }),
}));

// Create schemas for insertion and validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  isAdmin: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAllergenSchema = createInsertSchema(allergens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  createdAt: true,
});

export const insertClientInvitationSchema = createInsertSchema(clientInvitations).omit({
  id: true,
  createdAt: true,
  usedAt: true,
  inviteCode: true,
});

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type ClientInvitation = typeof clientInvitations.$inferSelect;
export type InsertClientInvitation = z.infer<typeof insertClientInvitationSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type Allergen = typeof allergens.$inferSelect;
export type InsertAllergen = z.infer<typeof insertAllergenSchema>;
export type QrCode = typeof qrCodes.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type MenuItemView = typeof menuItemViews.$inferSelect;
export type InsertMenuItemView = typeof menuItemViews.$inferInsert;
export type MenuLanguageUsage = typeof menuLanguageUsage.$inferSelect;
export type InsertMenuLanguageUsage = typeof menuLanguageUsage.$inferInsert;
export type RestaurantTemplateCustomization = typeof restaurantTemplateCustomizations.$inferSelect;
export type InsertRestaurantTemplateCustomization = typeof restaurantTemplateCustomizations.$inferInsert;
