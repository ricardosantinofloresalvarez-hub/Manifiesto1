import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  notes: text("notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
});

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export const manifestItems = pgTable("manifest_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(1),
  estimatedValue: real("estimated_value"),
  serialNumber: text("serial_number"),
  imageUrl: text("image_url"),
  // Luggage metadata fields
  luggageBrand: text("luggage_brand"),
  luggageSize: text("luggage_size"),
  isSealed: boolean("is_sealed").default(false),
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertManifestItemSchema = createInsertSchema(manifestItems).omit({
  id: true,
  createdAt: true,
});

export type InsertManifestItem = z.infer<typeof insertManifestItemSchema>;
export type ManifestItem = typeof manifestItems.$inferSelect;

export const manifestCertificates = pgTable("manifest_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  hash: text("hash").notNull().unique(),
  manifestData: text("manifest_data").notNull(),
  itemCount: integer("item_count").notNull(),
  totalValue: real("total_value"),
  verified: boolean("verified").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertManifestCertificateSchema = createInsertSchema(manifestCertificates).omit({
  id: true,
  createdAt: true,
});

export type InsertManifestCertificate = z.infer<typeof insertManifestCertificateSchema>;
export type ManifestCertificate = typeof manifestCertificates.$inferSelect;
