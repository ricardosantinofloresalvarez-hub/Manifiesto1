import { Router } from "express";
import { db } from "./db";
import { users, purchases } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

const WOMPI_APP_ID = process.env.WOMPI_APP_ID!;
const WOMPI_SECRET = process.env.WOMPI_SECRET!;
const WOMPI_API = "https://api.wompi.sv/api";
const BASE_URL = (process.env.BASE_URL || "https://proyecto-manifiesto.replit.app").trim();

const PRODUCT_PRICES: Record<string, number> = {
  "pack3": 299,
  "pack10": 699,
  "annual": 1299,
};

const PRODUCT_CREDITS: Record<string, number> = {
  "pack3": 3,
  "pack10": 10,
  "annual": -1,
};

// GET /api/wompi/checkout/:productId
router.get("/checkout/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const storedUserId = req.query.userId as string;
    const user = req.user as any;
    const userId = storedUserId || user?.id;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const amount = PRODUCT_PRICES[productId];
    if (!amount) return res.status(404).json({ error: "Producto no encontrado" });

    const reference = `${userId}|${productId}|${Date.now()}`;
    const redirectUrl = `${BASE_URL}/dashboard?payment=success`;

    const checkoutUrl = `https://checkout.wompi.sv/p/?public-key=${WOMPI_APP_ID}&currency=USD&amount-in-cents=${amount}&reference=${reference}&redirect-url=${encodeURIComponent(redirectUrl)}`;

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Wompi checkout error:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/wompi/webhook
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;
    if (event?.event !== "transaction.updated") return res.json({ ok: true });

    const transaction = event?.data?.transaction;
    if (transaction?.status !== "APPROVED") return res.json({ ok: true });

    const reference = transaction?.reference;
    const orderId = transaction?.id;
    const [userId, productId] = reference.split("|");

    const existing = await db.select().from(purchases).where(eq(purchases.orderId, orderId));
    if (existing.length > 0) return res.json({ ok: true });

    const creditsToAdd = PRODUCT_CREDITS[productId] ?? 0;
    const amount = PRODUCT_PRICES[productId] ?? 0;

    await db.insert(purchases).values({
      userId, orderId, productId, amount, status: "paid",
      manifestsAdded: creditsToAdd === -1 ? 9999 : creditsToAdd,
    });

    if (creditsToAdd === -1) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await db.update(users).set({
        planType: "annual", planExpiresAt: expiresAt, manifestCredits: 9999,
      }).where(eq(users.id, userId));
    } else {
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
      await db.update(users).set({
        manifestCredits: (currentUser.manifestCredits || 0) + creditsToAdd,
      }).where(eq(users.id, userId));
    }

    console.log(`✅ Wompi pago procesado: user=${userId}, producto=${productId}`);
    res.json({ ok: true });
  } catch (error) {
    console.error("Wompi webhook error:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
