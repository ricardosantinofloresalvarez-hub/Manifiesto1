import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  destination: text("destination").notNull(),
  imageUrl: text("image_url").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
});

export const luggage = pgTable("luggage", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  nickname: text("nickname"),
  brand: text("brand"),
  type: text("type"),
  size: text("size"),
  isSealed: boolean("is_sealed").default(false),
  isLocked: boolean("is_locked").default(false),
  certificateHash: text("certificate_hash"),
});

export const manifestItems = pgTable("manifest_items", {
  id: serial("id").primaryKey(),
  luggageId: integer("luggage_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  brand: text("brand"),
  quantity: integer("quantity").default(1),
  value: integer("value").default(0),
  notes: text("notes"),
});

export const insertTripSchema = createInsertSchema(trips);
export const insertLuggageSchema = createInsertSchema(luggage);
export const insertManifestItemSchema = createInsertSchema(manifestItems);

export type Trip = typeof trips.$inferSelect;
export type Luggage = typeof luggage.$inferSelect;
export type ManifestItem = typeof manifestItems.$inferSelect;