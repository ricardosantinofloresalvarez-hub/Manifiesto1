import { Router } from "express";
import { db } from "./db";
import { travelers } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/travelers?tripId=xxx - Listar pasajeros de un viaje
router.get("/", async (req, res) => {
  try {
    const { tripId } = req.query;
    if (!tripId) {
      return res.status(400).send("tripId is required");
    }

    const results = await db
      .select()
      .from(travelers)
      .where(eq(travelers.tripId, String(tripId)));

    res.json(results);
  } catch (error) {
    console.error("Error fetching travelers:", error);
    res.status(500).send("Error fetching travelers");
  }
});

// POST /api/travelers - Crear pasajero
router.post("/", async (req, res) => {
  try {
    const [newTraveler] = await db
      .insert(travelers)
      .values(req.body)
      .returning();

    res.json(newTraveler);
  } catch (error) {
    console.error("Error creating traveler:", error);
    res.status(500).send("Error creating traveler");
  }
});

// DELETE /api/travelers/:id - Eliminar pasajero
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [deleted] = await db
      .delete(travelers)
      .where(eq(travelers.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).send("Traveler not found");
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting traveler:", error);
    res.status(500).send("Error deleting traveler");
  }
});

export default router;