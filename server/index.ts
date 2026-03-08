import express from "express";
import cors from "cors";
import manifestItemsRoutes from "./manifestItems";
import luggageRoutes from "./luggageRoutes";
import authRoutes from "./authRoutes"
import tripRoutes from "./tripRoutes";
import travelerRoutes from "./travelerRoutes";
import itineraryRoutes from "./itineraryRoutes";

const app = express();

app.get("/", (_req, res) => {
  res.send("OK");
});
// Servir archivos estáticos de public
app.use(express.static('public'));

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
/* SERVER */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});