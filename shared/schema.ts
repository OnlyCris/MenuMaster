import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: text("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  role: text("role").default("user"),
  hasPaid: integer("has_paid", { mode: "boolean" }).default(false),
  stripeCustomerId: text("stripe_customer_id"),
  paymentDate: text("payment_date"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Client invitations table
export const clientInvitations = sqliteTable("client_invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  status: text("status").notNull().default("pending"),
  invitedBy: text("invited_by"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at"),
  usedAt: text("used_at"),
});

// Restaurant table
export const restaurants = sqliteTable("restaurants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location"),
  subdomain: text("subdomain").notNull().unique(),
  logoUrl: text("logo_url"),
  ownerId: text("owner_id").notNull(),
  templateId: integer("template_id").default(1),
  category: text("category"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Template table
export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  cssStyles: text("css_styles"),
  isPopular: integer("is_popular", { mode: "boolean" }).default(false),
  isNew: integer("is_new", { mode: "boolean" }).default(false),
  customizable: integer("customizable", { mode: "boolean" }).default(true),
  colorVariables: text("color_variables"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Category table
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  restaurantId: integer("restaurant_id").notNull(),
  sortOrder: integer("sort_order").default(0),
  isVisible: integer("is_visible", { mode: "boolean" }).default(true),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Menu item table
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  categoryId: integer("category_id").notNull(),
  isAvailable: integer("is_available", { mode: "boolean" }).default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Allergen table
export const allergens = sqliteTable("allergens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  icon: text("icon"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Menu item allergens junction table
export const menuItemAllergens = sqliteTable(
  "menu_item_allergens",
  {
    menuItemId: integer("menu_item_id").notNull(),
    allergenId: integer("allergen_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.menuItemId, table.allergenId] })],
);

// QR code table
export const qrCodes = sqliteTable("qr_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  createdAt: text("created_at"),
});

// Analytics table
export const analytics = sqliteTable("analytics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  restaurantId: integer("restaurant_id").notNull(),
  date: text("date").notNull(),
  visits: integer("visits").default(0),
  qrScans: integer("qr_scans").default(0),
  createdAt: text("created_at"),
});

// Relations
export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, { fields: [restaurants.ownerId], references: [users.id] }),
  template: one(templates, { fields: [restaurants.templateId], references: [templates.id] }),
  categories: many(categories),
  qrCodes: many(qrCodes),
  analytics: many(analytics),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [categories.restaurantId], references: [restaurants.id] }),
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, { fields: [menuItems.categoryId], references: [categories.id] }),
  allergens: many(menuItemAllergens),
}));

export const allergensRelations = relations(allergens, ({ many }) => ({
  menuItems: many(menuItemAllergens),
}));

export const menuItemAllergensRelations = relations(menuItemAllergens, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuItemAllergens.menuItemId], references: [menuItems.id] }),
  allergen: one(allergens, { fields: [menuItemAllergens.allergenId], references: [allergens.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
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
});

// Type exports
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