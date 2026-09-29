import { Router } from "express";
import { requireAuth } from "./authMiddleware";
import { db } from "./db";
import {
  flights, hotels, transport, restaurants, activities, trips,
  insertFlightSchema, insertHotelSchema, insertTransportSchema, insertRestaurantSchema, insertActivitySchema
} from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

function getTable(type: string) {
  switch (type) {
    case "flights": return flights;
    case "hotels": return hotels;
    case "transport": return transport;
    case "restaurants": return restaurants;
    case "activities": return activities;
    default: throw new Error(`Invalid itinerary type: ${type}`);
  }
}
function getSchema(type: string) {
  switch (type) {
    case "flights": return insertFlightSchema;
    case "hotels": return insertHotelSchema;
    case "transport": return insertTransportSchema;
    case "restaurants": return insertRestaurantSchema;
    case "activities": return insertActivitySchema;
    default: throw new Error(`Invalid itinerary type: ${type}`);
  }
}

async function tripBelongsToUser(tripId: string, userId: string): Promise<boolean> {
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
  return !!trip && trip.userId === userId;
}

async function itemBelongsToUser(table: any, id: string, userId: string): Promise<boolean> {
  const [existing] = await db.select().from(table).where(eq(table.id, id));
  if (!existing) return false;
  return tripBelongsToUser((existing as any).tripId, userId);
}

router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { tripId } = req.query;
    const userId = (req.user as any)?.id;
    if (!tripId) return res.status(400).send("tripId is required");
    if (!(await tripBelongsToUser(String(tripId), userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const table = getTable(type);
    const results = await db.select().from(table).where(eq(table.tripId, String(tripId)));
    res.json(results);
  } catch (error) {
    console.error(`Error fetching ${req.params.type}:`, error);
    res.status(500).send(`Error fetching ${req.params.type}`);
  }
});

router.post("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const userId = (req.user as any)?.id;
    const table = getTable(type);
    const schema = getSchema(type);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    }
    if (!(await tripBelongsToUser(req.body.tripId, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const [newItem] = await db.insert(table).values(req.body).returning();
    res.json(newItem);
  } catch (error) {
    console.error(`Error creating ${req.params.type}:`, error);
    res.status(500).send(`Error creating ${req.params.type}`);
  }
});

router.patch("/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = (req.user as any)?.id;
    const table = getTable(type);
    if (!(await itemBelongsToUser(table, id, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const { userId: _ignore, ...updateData } = req.body;
    const schema = getSchema(type);
    const parsedUpdate = schema.partial().safeParse(updateData);
    if (!parsedUpdate.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsedUpdate.error.flatten() });
    }
    const [updated] = await db.update(table).set(updateData).where(eq(table.id, id)).returning();
    if (!updated) return res.status(404).send("Item not found");
    res.json(updated);
  } catch (error) {
    console.error(`Error updating ${req.params.type}:`, error);
    res.status(500).send(`Error updating ${req.params.type}`);
  }
});

router.delete("/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = (req.user as any)?.id;
    const table = getTable(type);
    if (!(await itemBelongsToUser(table, id, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const [deleted] = await db.delete(table).where(eq(table.id, id)).returning();
    if (!deleted) return res.status(404).send("Item not found");
    res.json({ success: true, id });
  } catch (error) {
    console.error(`Error deleting ${req.params.type}:`, error);
    res.status(500).send(`Error deleting ${req.params.type}`);
  }
});

export default router;
