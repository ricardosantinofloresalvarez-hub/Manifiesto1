import { Router } from "express";
import { requireAuth } from "./authMiddleware";
import { db } from "./db";
import { travelers, trips } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

async function tripBelongsToUser(tripId: string, userId: string): Promise<boolean> {
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
  return !!trip && trip.userId === userId;
}

async function travelerBelongsToUser(travelerId: string, userId: string): Promise<boolean> {
  const [traveler] = await db.select().from(travelers).where(eq(travelers.id, travelerId));
  if (!traveler) return false;
  return tripBelongsToUser(traveler.tripId, userId);
}

router.get("/", async (req, res) => {
  try {
    const { tripId } = req.query;
    const userId = (req.user as any)?.id;
    if (!tripId) return res.status(400).send("tripId is required");
    if (!(await tripBelongsToUser(String(tripId), userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const results = await db.select().from(travelers).where(eq(travelers.tripId, String(tripId)));
    res.json(results);
  } catch (error) {
    console.error("Error fetching travelers:", error);
    res.status(500).send("Error fetching travelers");
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!(await tripBelongsToUser(req.body.tripId, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const [newTraveler] = await db.insert(travelers).values(req.body).returning();
    res.json(newTraveler);
  } catch (error) {
    console.error("Error creating traveler:", error);
    res.status(500).send("Error creating traveler");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    if (!(await travelerBelongsToUser(id, userId))) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const [deleted] = await db.delete(travelers).where(eq(travelers.id, id)).returning();
    if (!deleted) return res.status(404).send("Traveler not found");
    res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting traveler:", error);
    res.status(500).send("Error deleting traveler");
  }
});

export default router;
