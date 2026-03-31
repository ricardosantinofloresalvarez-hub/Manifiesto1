import { Router } from "express";
import { db } from "./db";
import { users, purchases } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API = "https://api-m.paypal.com";

const PRODUCT_CREDITS: Record<string, number> = {
  "pack3": 3,
  "pack10": 10,
  "annual": -1,
};

const PRODUCT_PRICES: Record<string, string> = {
  "pack3": "2.99",
  "pack10": "6.99",
  "annual": "12.99",
};

async function getAccessToken() {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Authorization": `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json() as any;
  return data.access_token;
}

// GET /api/paypal/checkout/:productId
router.get("/checkout/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const user = req.user as any;
    const userId = (req.query.userId as string) || user?.id;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const price = PRODUCT_PRICES[productId];
    if (!price) return res.status(404).json({ error: "Producto no encontrado" });

    const accessToken = await getAccessToken();
    const baseUrl = (process.env.BASE_URL || "").trim() || "https://proyecto-manifiesto.replit.app";

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: price },
          description: `Manifiesto - ${productId}`,
          custom_id: `${userId}|${productId}`,
        }],
        application_context: {
          return_url: `${baseUrl}/api/paypal/capture`,
          cancel_url: `${baseUrl}/dashboard`,
          brand_name: "Manifiesto",
          user_action: "PAY_NOW",
        },
      }),
    });

    const order = await orderRes.json() as any;
    console.log("PayPal response:", JSON.stringify(order));
    const approvalUrl = order.links?.find((l: any) => l.rel === "approve")?.href;
    if (!approvalUrl) return res.status(500).json({ error: "No se pudo crear el pago" });

    res.json({ url: approvalUrl });
  } catch (error) {
    console.error("PayPal checkout error:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// GET /api/paypal/capture
router.get("/capture", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.redirect("/dashboard?payment=error");

    const accessToken = await getAccessToken();
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const capture = await captureRes.json() as any;
    if (capture.status !== "COMPLETED") return res.redirect("/dashboard?payment=error");

    const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
    const orderId = capture.id;
    const [userId, productId] = customId.split("|");

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

    res.redirect("/dashboard?payment=success");
  } catch (error) {
    console.error("PayPal capture error:", error);
    res.redirect("/dashboard?payment=error");
  }
});

// GET /api/paypal/client-id
router.get("/client-id", (_req, res) => {
  res.json({ clientId: PAYPAL_CLIENT_ID });
});

export default router;
