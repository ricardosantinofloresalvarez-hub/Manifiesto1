import { Router } from "express";
import { db } from "./db";
import { trips } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/trips?userId=xxx
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).send("userId is required");

    const results = await db.select().from(trips).where(eq(trips.userId, String(userId)));
    res.json(results);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).send("Error fetching trips");
  }
});

// GET /api/trips/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));

    if (!trip) return res.status(404).send("Trip not found");
    res.json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).send("Error fetching trip");
  }
});

// POST /api/trips
router.post("/", async (req, res) => {
  try {
    const [newTrip] = await db.insert(trips).values(req.body).returning();
    res.json(newTrip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).send("Error creating trip");
  }
});

// PATCH /api/trips/:id
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.update(trips).set(req.body).where(eq(trips.id, id)).returning();

    if (!updated) return res.status(404).send("Trip not found");
    res.json(updated);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).send("Error updating trip");
  }
});

// DELETE /api/trips/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db.delete(trips).where(eq(trips.id, id)).returning();

    if (!deleted) return res.status(404).send("Trip not found");
    res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).send("Error deleting trip");
  }
});

export default router;