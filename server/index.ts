import express from "express";
import cors from "cors";

import manifestItemsRoutes from "./manifestItems";
import luggageRoutes from "./luggageRoutes";

const app = express();

app.get("/", (_req, res) => {
  res.send("OK");
});

/* BODY PARSER */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use("/uploads", express.static("uploads"));

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

/* SERVER */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
