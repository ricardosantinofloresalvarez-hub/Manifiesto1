import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import manifestItemsRoutes from "./manifestItems";
import luggageRoutes from "./luggageRoutes";
import authRoutes from "./authRoutes"
import tripRoutes from "./tripRoutes";
import travelerRoutes from "./travelerRoutes";
import itineraryRoutes from "./itineraryRoutes";
import paymentsRoutes from "./paymentsRoutes";
import adminRoutes from "./adminRoutes";
import paypalRoutes from "./paypalRoutes";
import paddleRoutes from "./paddleRoutes";

const app = express();

app.use(express.static('dist/public'));
app.get("/", (_req, res) => {
  res.sendFile('index.html', { root: 'dist/public' });
});


/* SESSION */
app.use(session({
  secret: process.env.SESSION_SECRET || 'manifiesto-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

/* PASSPORT */
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: `${(process.env.BASE_URL || 'https://proyecto-manifiesto.replit.app').trim()}/api/auth/google/callback`
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0].value!;
    const name = profile.displayName;
    const photoUrl = profile.photos?.[0].value;
    let [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      const userId = crypto.randomUUID();
      [user] = await db.insert(users).values({ id: userId, email, name, photoUrl }).returning();
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/* BODY PARSER */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* CORS */
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

/* RUTAS */
app.use("/api/manifestItems", manifestItemsRoutes);
app.use("/api/luggage", luggageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/travelers", travelerRoutes);

app.get("/api/found/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { db } = await import("./db.js");
    const { sql } = await import("drizzle-orm");
    
    const result = await db.execute(sql.raw(`SELECT id as "luggageId", nickname, type, color, trip_id as "tripId" FROM luggage WHERE recovery_token = '${token.replace(/'/g, "''")}'`));
    
    if (!result.rows.length) return res.status(404).json({ error: "No encontrado" });
    res.json({ found: true, luggage: result.rows[0] });
  } catch (error) {
    console.error("Found error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

app.post("/api/found/:token/report", async (req, res) => {
  try {
    const { token } = req.params;
    const { message } = req.body;
    const { db } = await import("./db.js");
    const { luggage, trips, users } = await import("../shared/schema.js");
    const { eq } = await import("drizzle-orm");
    const { Resend } = await import("resend");
    
    const { sql: sqlTag } = await import("drizzle-orm");
    const bagResult = await db.execute(sqlTag.raw(`SELECT id as "luggageId", nickname, trip_id as "tripId" FROM luggage WHERE recovery_token = '${token.replace(/'/g, "''")}'`));
    if (!bagResult.rows.length) return res.status(404).json({ error: "No encontrado" });
    const bag = bagResult.rows[0] as any;

    const tripResult = await db.execute(sqlTag.raw(`SELECT user_id as "userId" FROM trips WHERE id = '${bag.tripId}'`));
    if (!tripResult.rows.length) return res.status(404).json({ error: "Viaje no encontrado" });

    const userResult = await db.execute(sqlTag.raw(`SELECT email, name FROM users WHERE id = '${(tripResult.rows[0] as any).userId}'`));
    if (!userResult.rows.length) return res.status(404).json({ error: "Usuario no encontrado" });
    
    const owner = userResult[0];
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: "noreply@manifiesto.app",
      to: owner.email,
      subject: "🧳 Alguien encontró tu maleta",
      html: `
        <h2>Buenas noticias</h2>
        <p>Alguien escaneó el código QR de tu maleta <strong>${bag.nickname || "sin nombre"}</strong>.</p>
        <p><strong>Hora:</strong> ${new Date().toLocaleString("es-ES")}</p>
        ${message ? `<p><strong>Mensaje:</strong> ${message}</p>` : ""}
        <p>Entra a <a href="https://manifiesto.app">manifiesto.app</a> para más detalles.</p>
      `
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});
app.post("/api/dictate", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: `Extrae la información de este texto dictado sobre un artículo de equipaje: "${text}". Responde SOLO con JSON válido sin explicaciones: {"name": "nombre del artículo", "category": "una de: clothing|electronics|footwear|accessories|documents|medications|other", "brand": "marca si se menciona sino null", "quantity": número entero, "value": número decimal si se menciona precio sino null}` }]
    });
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = responseText.replace(/\`\`\`json|\`\`\`/g, "").trim();
    const parsed = JSON.parse(clean);
    console.log("DICTATE PARSED:", JSON.stringify(parsed));
    res.json(parsed);
  } catch (error) {
    console.error("Dictate error:", error);
    res.status(500).json({ error: "Error procesando dictado" });
  }
});
app.use("/api", itineraryRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/paddle", paddleRoutes);
app.get("*", (_req, res) => {
  res.sendFile("index.html", { root: "dist/public" });
});

/* SERVER */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});