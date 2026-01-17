import { Router } from "express";
import { db } from "./db.ts";
import { manifestItems, luggage } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/manifestItems?luggageId=xxx - Get items by luggage ID
router.get("/", async (req, res) => {
  try {
    const { luggageId } = req.query;

    if (!luggageId || typeof luggageId !== "string") {
      return res.status(400).send("luggageId is required");
    }

    const items = await db
      .select()
      .from(manifestItems)
      .where(eq(manifestItems.luggageId, luggageId));

    res.json(items);
  } catch (error) {
    console.error("Error fetching manifest items:", error);
    res.status(500).send("Error fetching manifest items");
  }
});

// GET /api/manifestItems/trip/:tripId - Get ALL items for a trip
router.get("/trip/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;

    // First get all luggage for this trip
    const luggageList = await db
      .select()
      .from(luggage)
      .where(eq(luggage.tripId, tripId));

    if (luggageList.length === 0) {
      return res.json([]);
    }

    const luggageIds = luggageList.map((l) => l.id);

    // Get all items for those luggage pieces
    const allItems = [];
    for (const luggageId of luggageIds) {
      const items = await db
        .select()
        .from(manifestItems)
        .where(eq(manifestItems.luggageId, luggageId));
      allItems.push(...items);
    }

    res.json(allItems);
  } catch (error) {
    console.error("Error fetching trip items:", error);
    res.status(500).send("Error fetching trip items");
  }
});

// POST /api/manifestItems - Create new item
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    if (!data.luggageId || !data.name || !data.category) {
      return res.status(400).send("luggageId, name, and category are required");
    }

    const [newItem] = await db
      .insert(manifestItems)
      .values({
        luggageId: data.luggageId,
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        quantity: data.quantity || 1,
        value: data.value || null,
        serialNumber: data.serialNumber || null,
        photoUrl: data.photoUrl || null,
        notes: data.notes || null,
      })
      .returning();

    res.json(newItem);
  } catch (error) {
    console.error("Error creating manifest item:", error);
    res.status(500).send("Error creating manifest item");
  }
});

// PUT /api/manifestItems/:id - Update item
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const [updatedItem] = await db
      .update(manifestItems)
      .set({
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        quantity: data.quantity,
        value: data.value || null,
        serialNumber: data.serialNumber || null,
        photoUrl: data.photoUrl || null,
        notes: data.notes || null,
      })
      .where(eq(manifestItems.id, id))
      .returning();

    if (!updatedItem) {
      return res.status(404).send("Item not found");
    }

    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating manifest item:", error);
    res.status(500).send("Error updating manifest item");
  }
});

// DELETE /api/manifestItems/:id - Delete item
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedItem] = await db
      .delete(manifestItems)
      .where(eq(manifestItems.id, id))
      .returning();

    if (!deletedItem) {
      return res.status(404).send("Item not found");
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting manifest item:", error);
    res.status(500).send("Error deleting manifest item");
  }
});

export default router;
