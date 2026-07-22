import { Router } from "express";
import { db } from "./db";
import { users, purchases } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
const PRODUCT_3 = process.env.LEMONSQUEEZY_PRODUCT_3!;
const PRODUCT_10 = process.env.LEMONSQUEEZY_PRODUCT_10!;
const PRODUCT_ANUAL = process.env.LEMONSQUEEZY_PRODUCT_ANUAL!;

// Mapeo de producto a manifiestos
const PRODUCT_CREDITS: Record<string, number> = {
  [PRODUCT_3]: 3,
  [PRODUCT_10]: 10,
  [PRODUCT_ANUAL]: -1, // -1 = ilimitado
};

// GET /api/payments/checkout/:productId
// Genera URL de checkout de Lemon Squeezy
router.get("/checkout/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: "No autenticado" });

    // Obtener variants del producto
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${productId}`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
        },
      }
    );
    const data = await response.json() as any;
    const variantId = data.data?.[0]?.id;
    if (!variantId) return res.status(404).json({ error: "Producto no encontrado" });

    // Crear checkout
    const checkoutRes = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              name: user.name,
              custom: { user_id: user.id },
            },
          },
          relationships: {
            store: {
              data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID },
            },
            variant: {
              data: { type: "variants", id: variantId },
            },
          },
        },
      }),
    });

    const checkoutData = await checkoutRes.json() as any;
    const checkoutUrl = checkoutData.data?.attributes?.url;
    if (!checkoutUrl) return res.status(500).json({ error: "No se pudo crear el checkout" });

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Error checkout:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/payments/webhook
// Webhook de Lemon Squeezy — acredita manifiestos al usuario
router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-signature"] as string;

    if (secret && signature) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = hmac.update(JSON.stringify(req.body)).digest("hex");
      if (digest !== signature) {
        return res.status(401).json({ error: "Firma inválida" });
      }
    }

    const event = req.body;
    const eventName = event?.meta?.event_name;

    if (eventName === "order_created") {
      const orderId = event.data?.id;
      const userId = event.meta?.custom_data?.user_id;
      const productId = String(event.data?.attributes?.first_order_item?.product_id);
      const amount = event.data?.attributes?.total;

      if (!userId || !orderId) return res.status(400).json({ error: "Datos incompletos" });

      // Verificar si ya procesamos esta orden
      const existing = await db.select().from(purchases).where(eq(purchases.orderId, orderId));
      if (existing.length > 0) return res.json({ ok: true, message: "Ya procesado" });

      const creditsToAdd = PRODUCT_CREDITS[productId] ?? 0;

      // Guardar compra
      await db.insert(purchases).values({
        userId,
        orderId,
        productId,
        amount,
        status: "paid",
        manifestsAdded: creditsToAdd === -1 ? 9999 : creditsToAdd,
      });

      // Actualizar usuario
      if (creditsToAdd === -1) {
        // Plan anual: ilimitado por 1 año
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        await db.update(users).set({
          planType: "annual",
          planExpiresAt: expiresAt,
          manifestCredits: 9999,
        }).where(eq(users.id, userId));
      } else {
        // Paquete: sumar créditos
        const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
        await db.update(users).set({
          manifestCredits: (currentUser.manifestCredits || 0) + creditsToAdd,
        }).where(eq(users.id, userId));
      }

      console.log(`✅ Pago procesado: user=${userId}, producto=${productId}, créditos=${creditsToAdd}`);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Error webhook:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// GET /api/payments/credits
// Retorna créditos actuales del usuario
router.get("/credits", async (req, res) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: "No autenticado" });
    const [currentUser] = await db.select().from(users).where(eq(users.id, user.id));
    res.json({
      manifestCredits: currentUser.manifestCredits,
      planType: currentUser.planType,
      planExpiresAt: currentUser.planExpiresAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
