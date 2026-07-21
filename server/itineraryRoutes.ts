import { Router } from "express";
import { requireAuth } from "./authMiddleware";
import { db } from "./db";
import { flights, hotels, transport, restaurants, activities } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Helper function to get the correct table
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

// GET /api/:type?tripId=xxx - List items
router.get("/:type", requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { tripId } = req.query;

    if (!tripId) {
      return res.status(400).send("tripId is required");
    }

    const table = getTable(type);
    const results = await db
      .select()
      .from(table)
      .where(eq(table.tripId, String(tripId)));

    res.json(results);
  } catch (error) {
    console.error(`Error fetching ${req.params.type}:`, error);
    res.status(500).send(`Error fetching ${req.params.type}`);
  }
});

// POST /api/:type - Create item
router.post("/:type", requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const table = getTable(type);

    const [newItem] = await db
      .insert(table)
      .values(req.body)
      .returning();

    res.json(newItem);
  } catch (error) {
    console.error(`Error creating ${req.params.type}:`, error);
    res.status(500).send(`Error creating ${req.params.type}`);
  }
});

// PATCH /api/:type/:id - Update item
router.patch("/:type/:id", requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const table = getTable(type);

    const [updated] = await db
      .update(table)
      .set(req.body)
      .where(eq(table.id, id))
      .returning();

    if (!updated) {
      return res.status(404).send("Item not found");
    }

    res.json(updated);
  } catch (error) {
    console.error(`Error updating ${req.params.type}:`, error);
    res.status(500).send(`Error updating ${req.params.type}`);
  }
});

// DELETE /api/:type/:id - Delete item
router.delete("/:type/:id", requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const table = getTable(type);

    const [deleted] = await db
      .delete(table)
      .where(eq(table.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).send("Item not found");
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error(`Error deleting ${req.params.type}:`, error);
    res.status(500).send(`Error deleting ${req.params.type}`);
  }
});

export default router;