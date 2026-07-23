import { Router } from "express";
import { requireAuth } from "./authMiddleware";
import { db } from "./db";
import { manifestItems, luggage, trips } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// 1. GET /api/manifestItems?luggageId=xxx - Obtener artículos por ID de maleta
router.get("/", async (req, res) => {
  try {
    const { luggageId, userId } = req.query;

    if (!luggageId || typeof luggageId !== "string") {
      return res.status(400).send("luggageId is required");
    }

    if (userId) {
      const [bag] = await db.select().from(luggage).where(eq(luggage.id, luggageId));
      if (bag) {
        const [trip] = await db.select().from(trips).where(eq(trips.id, bag.tripId));
        if (!trip || trip.userId !== String(userId)) return res.status(403).json({ error: "No autorizado" });
      }
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

// 2. GET /api/manifestItems/trip/:tripId - Obtener TODOS los artículos de un viaje
router.get("/trip/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;

    const luggageList = await db
      .select()
      .from(luggage)
      .where(eq(luggage.tripId, tripId));

    if (luggageList.length === 0) {
      return res.json([]);
    }

    const luggageIds = luggageList.map((l) => l.id);

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

// 3. POST /api/manifestItems - Crear nuevo artículo
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

// 4. PUT /api/manifestItems/:id - Actualizar artículo
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params; // ID es string (VARCHAR), no número
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

// 5. DELETE /api/manifestItems/:id - Eliminar artículo
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params; // ID es string (VARCHAR), no número

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