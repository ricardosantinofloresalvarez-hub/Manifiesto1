import { Router } from "express";
import { requireAuth } from "./authMiddleware";
import { db } from "./db";
import { users, trips, purchases } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

const router = Router();
const ADMIN_EMAIL = "ricardosantino.floresalvarez@gmail.com";

async function isAdmin(userId: string) {
  if (!userId) return false;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user?.email === ADMIN_EMAIL;
}

router.get("/users", requireAuth, async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!await isAdmin(userId)) return res.status(403).json({ error: "No autorizado" });
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      manifestCredits: users.manifestCredits,
      planType: users.planType,
      createdAt: users.createdAt,
    }).from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!await isAdmin(userId)) return res.status(403).json({ error: "No autorizado" });
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalTrips] = await db.select({ count: sql<number>`count(*)` }).from(trips);
    const [totalPurchases] = await db.select({ count: sql<number>`count(*)` }).from(purchases);
    const [totalRevenue] = await db.select({ sum: sql<number>`coalesce(sum(amount), 0)` }).from(purchases);
    res.json({
      totalUsers: Number(totalUsers.count),
      totalTrips: Number(totalTrips.count),
      totalPurchases: Number(totalPurchases.count),
      totalRevenue: Number(totalRevenue.sum),
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/users/:id/credits", requireAuth, async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!await isAdmin(userId)) return res.status(403).json({ error: "No autorizado" });
    const { credits } = req.body;
    if (typeof credits !== 'number') return res.status(400).json({ error: "Créditos inválidos" });
    await db.update(users).set({ manifestCredits: credits }).where(eq(users.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/users/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!await isAdmin(userId)) return res.status(403).json({ error: "No autorizado" });
    const { id } = req.params;
    // Eliminar en cascada
    await db.delete(purchases).where(eq(purchases.userId, id));
    await db.delete(trips).where(eq(trips.userId, id));
    await db.delete(users).where(eq(users.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
