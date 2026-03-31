import { Router } from "express";
import { db } from "./db";
import { users, trips, purchases } from "@shared/schema";
import { sql } from "drizzle-orm";

const router = Router();

const ADMIN_EMAIL = "ricardosantino.floresalvarez@gmail.com";

function isAdmin(req: any, res: any, next: any) {
  const user = req.user as any;
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "No autorizado" });
  }
  next();
}

router.get("/users", isAdmin, async (_req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/stats", isAdmin, async (_req, res) => {
  try {
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

export default router;
