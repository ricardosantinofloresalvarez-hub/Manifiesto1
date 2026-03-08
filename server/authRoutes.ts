import { Router } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Email y nombre son requeridos" });
    }

    let [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      const userId = crypto.createHash('sha256').update(email).digest('hex').substring(0, 36);
      [user] = await db.insert(users).values({ id: userId, email, name }).returning();
    } else {
      [user] = await db.update(users).set({ name }).where(eq(users.email, email)).returning();
    }

    res.json(user);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});
// POST /api/auth/update-photo - Actualizar foto de perfil
router.post("/update-photo", async (req, res) => {
  try {
    const { userId, photoUrl } = req.body;

    if (!userId || !photoUrl) {
      return res.status(400).send("userId and photoUrl are required");
    }

    const [updatedUser] = await db
      .update(users)
      .set({ photoUrl })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).send("Error updating photo");
  }
});
export default router;