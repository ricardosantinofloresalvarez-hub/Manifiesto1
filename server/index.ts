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
import wompiRoutes from "./wompiRoutes";

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
  callbackURL: `${process.env.BASE_URL || 'https://159cf49c-0920-4684-b3d1-58a353686a03-00-32y8k86zgc8mg.worf.replit.dev'}/api/auth/google/callback`
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
app.use("/api", itineraryRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/wompi", wompiRoutes);
app.get("*", (_req, res) => {
  res.sendFile("index.html", { root: "dist/public" });
});

/* SERVER */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});