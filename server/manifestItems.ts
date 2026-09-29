import { Router } from "express";
import { requireAuth } from "./authMiddleware";
import { db } from "./db";
import { manifestItems, luggage, trips, insertManifestItemSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

async function luggageBelongsToUser(luggageId: string, userId: string): Promise<boolean> {
  const [bag] = await db.select().from(luggage).where(eq(luggage.id, luggageId));
  if (!bag) return false;
  const [trip] = await db.select().from(trips).where(eq(trips.id, bag.tripId));
  return !!trip && trip.userId === userId;
}

async function itemBelongsToUser(itemId: string, userId: string): Promise<boolean> {
  const [item] = await db.select().from(manifestItems).where(eq(manifestItems.id, itemId));
  if (!item) return false;
  return luggageBelongsToUser(item.luggageId, userId);
}

router.get("/", async (req, res) => {
  try {
    const { luggageId } = req.query;
    const userId = (req.user as any)?.id;
    if (!luggageId || typeof luggageId !== "string") {
      return res.status(400).send("luggageId is required");
    }
    if (!(await luggageBelongsToUser(luggageId, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const items = await db.select().from(manifestItems).where(eq(manifestItems.luggageId, luggageId));
    res.json(items);
  } catch (error) {
    console.error("Error fetching manifest items:", error);
    res.status(500).send("Error fetching manifest items");
  }
});

router.get("/trip/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = (req.user as any)?.id;
    const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
    if (!trip || trip.userId !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const luggageList = await db.select().from(luggage).where(eq(luggage.tripId, tripId));
    if (luggageList.length === 0) return res.json([]);
    const luggageIds = luggageList.map((l) => l.id);
    const allItems = [];
    for (const luggageId of luggageIds) {
      const items = await db.select().from(manifestItems).where(eq(manifestItems.luggageId, luggageId));
      allItems.push(...items);
    }
    res.json(allItems);
  } catch (error) {
    console.error("Error fetching trip items:", error);
    res.status(500).send("Error fetching trip items");
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const userId = (req.user as any)?.id;
    const parsed = insertManifestItemSchema.safeParse(data);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    }
    if (!(await luggageBelongsToUser(data.luggageId, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const [newItem] = await db.insert(manifestItems).values({
      luggageId: data.luggageId,
      name: data.name,
      category: data.category,
      brand: data.brand || null,
      quantity: data.quantity || 1,
      value: data.value || null,
      serialNumber: data.serialNumber || null,
      photoUrl: data.photoUrl || null,
      notes: data.notes || null,
    }).returning();
    res.json(newItem);
  } catch (error) {
    console.error("Error creating manifest item:", error);
    res.status(500).send("Error creating manifest item");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = (req.user as any)?.id;
    if (!(await itemBelongsToUser(id, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const parsedUpdate = insertManifestItemSchema.partial().safeParse(data);
    if (!parsedUpdate.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsedUpdate.error.flatten() });
    }
    const [updatedItem] = await db.update(manifestItems).set({
      name: data.name,
      category: data.category,
      brand: data.brand || null,
      quantity: data.quantity,
      value: data.value || null,
      serialNumber: data.serialNumber || null,
      photoUrl: data.photoUrl || null,
      notes: data.notes || null,
    }).where(eq(manifestItems.id, id)).returning();
    if (!updatedItem) return res.status(404).send("Item not found");
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating manifest item:", error);
    res.status(500).send("Error updating manifest item");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    if (!(await itemBelongsToUser(id, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const [deletedItem] = await db.delete(manifestItems).where(eq(manifestItems.id, id)).returning();
    if (!deletedItem) return res.status(404).send("Item not found");
    res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting manifest item:", error);
    res.status(500).send("Error deleting manifest item");
  }
});

export default router;
