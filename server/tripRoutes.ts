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
    let imageUrl = req.body.imageUrl;
    if (!imageUrl && req.body.destination) {
      try {
        const destination = req.body.destination.trim();
        const rawCity = destination.split(',')[0].trim();
        const cityMap: Record<string, string> = {
          'tokio': 'Tokyo', 'tokío': 'Tokyo',
          'japon': 'Japan', 'japón': 'Japan',
          'paris': 'Paris', 'parís': 'Paris',
          'nueva york': 'New York',
          'londres': 'London',
          'roma': 'Rome',
          'venecia': 'Venice',
          'berlin': 'Berlin', 'berlín': 'Berlin',
          'munich': 'Munich', 'múnich': 'Munich',
          'moscu': 'Moscow', 'moscú': 'Moscow',
          'pekin': 'Beijing', 'pekín': 'Beijing',
          'seul': 'Seoul', 'seúl': 'Seoul',
          'dubai': 'Dubai',
          'cairo': 'Cairo', 'el cairo': 'Cairo',
          'sidney': 'Sydney',
          'ciudad de mexico': 'Mexico City',
          'cdmx': 'Mexico City',
        };
        const cityLower = rawCity.toLowerCase();
        const city = cityMap[cityLower] || rawCity;
        const hasCity = destination.includes(',');
        const query = hasCity ? `${city} city travel landmark` : `${city} travel landmark`;
        console.log('🔍 Searching Unsplash for:', query);
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
        );
        const data = await response.json();
        if (data.results?.[0]?.urls?.regular) {
          imageUrl = data.results[0].urls.regular;
          console.log('✅ Unsplash image found:', imageUrl);
        }
        } catch (err) {
        console.error('❌ Error fetching Unsplash image:', err);
      }
    }
    const [newTrip] = await db.insert(trips).values({ ...req.body, imageUrl }).returning();
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