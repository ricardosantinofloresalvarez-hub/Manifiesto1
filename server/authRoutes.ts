import { Router } from "express";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "Nombre inválido"),
});
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import passport from "passport";
import { sendMagicLink, verifyMagicToken } from "./magicLinkService";

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
// MAGIC LINK
router.post("/magic-link", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });
    await sendMagicLink(email);
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending magic link:", error);
    res.status(500).json({ error: "Error enviando el enlace" });
  }
});

router.get("/magic", async (req, res) => {
  try {
    const { token } = req.query as { token: string };
    if (!token) return res.redirect("/login?error=invalid");
    const user = await verifyMagicToken(token);
    if (!user) return res.redirect("/login?error=expired");
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl
    }));
    res.redirect(`${process.env.BASE_URL || 'https://159cf49c-0920-4684-b3d1-58a353686a03-00-32y8k86zgc8mg.worf.replit.dev'}/auth/callback?user=${userData}`);
  } catch (error) {
    console.error("Error verifying magic token:", error);
    res.redirect("/login?error=invalid");
  }
});

// GOOGLE OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const user = req.user as any;
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl
    }));
    res.redirect(`${process.env.BASE_URL || 'https://159cf49c-0920-4684-b3d1-58a353686a03-00-32y8k86zgc8mg.worf.replit.dev'}/auth/callback?user=${userData}`);
  }
);

export default router;