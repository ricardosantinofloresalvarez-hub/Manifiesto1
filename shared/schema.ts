import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
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

// NEW: Travelers table (pasajeros/viajeros)
export const travelers = pgTable("travelers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'adult' | 'child'
  age: integer("age"),
  relation: text("relation"), // 'hijo', 'hija', 'sobrino', etc.
  document: text("document"),
  isMainTraveler: boolean("is_main_traveler").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTravelerSchema = createInsertSchema(travelers).omit({
  id: true,
  createdAt: true,
});

export type InsertTraveler = z.infer<typeof insertTravelerSchema>;
export type Traveler = typeof travelers.$inferSelect;

// NEW: Luggage table (maletas)
export const luggage = pgTable("luggage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull(),
  travelerId: varchar("traveler_id"), // Optional: which traveler owns this luggage
  brand: text("brand"),
  size: text("size"), // 'small', 'medium', 'large', 'xlarge'
  type: text("type"), // 'cabin', 'checked', 'backpack', 'handbag'
  color: text("color"), // NEW: color de la maleta
  nickname: text("nickname"), // NEW: nombre/alias de la maleta (ej: "Maleta principal")
  isSealed: boolean("is_sealed").default(false),
  isLocked: boolean("is_locked").default(false),
  openPhotoUrl: text("open_photo_url"),
  closedPhotoUrl: text("closed_photo_url"),
  // NEW: Campos para certificado por maleta
  certificateHash: text("certificate_hash"),
  certificatePdfUrl: text("certificate_pdf_url"),
  isPremium: boolean("is_premium").default(false), // Para paywall (3ra maleta+)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLuggageSchema = createInsertSchema(luggage).omit({
  id: true,
  createdAt: true,
});

export type InsertLuggage = z.infer<typeof insertLuggageSchema>;
export type Luggage = typeof luggage.$inferSelect;

export const manifestCertificates = pgTable("manifest_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id"), // Mantener para compatibilidad, ahora opcional
  luggageId: varchar("luggage_id"), // NEW: Certificado vinculado a maleta específica
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
  userId: varchar("user_id"),
  airline: text("airline").notNull(),
  flightNumber: text("flight_number").notNull(),
  departureAirport: text("departure_airport").notNull(),
  arrivalAirport: text("arrival_airport").notNull(),
  departureDateTime: text("departure_date_time").notNull(),
  arrivalDateTime: text("arrival_date_time").notNull(),
  notes: text("notes"),
  certificateUrl: text("certificate_url"),
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
  userId: varchar("user_id"),
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
  userId: varchar("user_id"),
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
  userId: varchar("user_id"),
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
  userId: varchar("user_id"),
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
// Manifest Items (items dentro de cada maleta)
export const manifestItems = pgTable("manifest_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  luggageId: varchar("luggage_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  brand: text("brand"), // Marca del artículo
  quantity: integer("quantity").notNull().default(1),
  value: real("value"), // Mantener nombre original para compatibilidad
  serialNumber: text("serial_number"), // Para electrónicos (opcional)
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertManifestItemSchema = createInsertSchema(manifestItems).omit({
  id: true,
  createdAt: true,
});

export type InsertManifestItem = z.infer<typeof insertManifestItemSchema>;
export type ManifestItem = typeof manifestItems.$inferSelect;