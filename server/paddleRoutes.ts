import { Router } from "express";
import { db } from "./db";
import { users, purchases } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

const PADDLE_API_KEY = process.env.PADDLE_API_KEY!;
const PADDLE_API = "https://api.paddle.com";
const BASE_URL = (process.env.BASE_URL || "https://manifiesto.app").trim();

const PRODUCT_CREDITS: Record<string, number> = {
  "pack3": 3,
  "pack10": 10,
  "annual": -1,
  "pro599": -1,
};

const PRICE_IDS: Record<string, string> = {
  "pack3": "pri_01kntjaz1emrptz1rsmm1dcb5t",
  "pack10": "pri_01kntjhydjjn1k7etbfjka575s",
  "annual": "pri_01kntjtcg4t9jddrthncp8avvv",
  "pro599": "pri_01krq75y4zgwnc66kkzqd3an6k",
};

const PRODUCT_PRICES: Record<string, string> = {
  "pack3": "2.99",
  "pack10": "6.99",
  "annual": "12.99",
  "pro599": "5.99",
};

// GET /api/paddle/checkout/:productId
router.get("/checkout/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.query.userId as string;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const priceId = PRICE_IDS[productId];
    if (!priceId) return res.status(404).json({ error: "Producto no encontrado" });

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const response = await fetch(`${PADDLE_API}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        customer_id: null,
        custom_data: { userId, productId },
        checkout: {
          url: `${BASE_URL}/planes`,
        },
      }),
    });

    const data = await response.json() as any;
    
    if (!response.ok) {
      console.error("Paddle error:", data);
      return res.status(500).json({ error: "Error creando transacción" });
    }

    const checkoutUrl = data.data?.checkout?.url;
    if (!checkoutUrl) {
      console.error("Paddle no checkout URL:", JSON.stringify(data));
      return res.status(500).json({ error: "No se pudo crear el checkout" });
    }

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Paddle checkout error:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/paddle/webhook
router.post("/webhook", async (req, res) => {
  try {
    // Verificar firma de Paddle
    const signature = req.headers["paddle-signature"] as string;
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      const crypto = await import("crypto");
      const rawBody = JSON.stringify(req.body);
      const [tsPart, h1Part] = signature.split(";");
      const ts = tsPart?.split("=")[1];
      const h1 = h1Part?.split("=")[1];
      const signed = `${ts}:${rawBody}`;
      const expected = crypto.default.createHmac("sha256", webhookSecret).update(signed).digest("hex");
      if (expected !== h1) {
        console.warn("[SECURITY] Webhook signature invalida");
        return res.status(401).json({ error: "Firma invalida" });
      }
    }
    
    const event = req.body;
    
    if (event.event_type === "transaction.completed") {
      const transaction = event.data;
      const customData = transaction.custom_data;
      const userId = customData?.userId;
      const productId = customData?.productId;
      const orderId = transaction.id;

      if (!userId || !productId) return res.status(400).json({ error: "Missing data" });

      const existing = await db.select().from(purchases).where(eq(purchases.orderId, orderId));
      if (existing.length === 0) {
        const creditsToAdd = PRODUCT_CREDITS[productId] ?? 0;
        const amount = Math.round(parseFloat(PRODUCT_PRICES[productId] || "0") * 100);

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
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook error:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
