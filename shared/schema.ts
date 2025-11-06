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

// Itinerary Items - Flights
export const flights = pgTable("flights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  airline: text("airline").notNull(),
  flightNumber: text("flight_number").notNull(),
  departureAirport: text("departure_airport").notNull(),
  arrivalAirport: text("arrival_airport").notNull(),
  departureDateTime: text("departure_date_time").notNull(),
  arrivalDateTime: text("arrival_date_time").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFlightSchema = createInsertSchema(flights).omit({
  id: true,
  createdAt: true,
});

export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type Flight = typeof flights.$inferSelect;

// Itinerary Items - Hotels
export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  checkInDate: text("check_in_date").notNull(),
  checkOutDate: text("check_out_date").notNull(),
  reservationLink: text("reservation_link"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
  createdAt: true,
});

export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

// Itinerary Items - Transport (Trains, Buses, Ferries)
export const transport = pgTable("transport", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // train, bus, ferry
  company: text("company").notNull(),
  route: text("route").notNull(),
  departureDateTime: text("departure_date_time").notNull(),
  arrivalDateTime: text("arrival_date_time"),
  ticketNumber: text("ticket_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransportSchema = createInsertSchema(transport).omit({
  id: true,
  createdAt: true,
});

export type InsertTransport = z.infer<typeof insertTransportSchema>;
export type Transport = typeof transport.$inferSelect;

// Itinerary Items - Restaurants
export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  reservationDateTime: text("reservation_date_time").notNull(),
  placeLink: text("place_link"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

// Itinerary Items - Activities
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  activityDateTime: text("activity_date_time").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
