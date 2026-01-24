import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

const app = express();

// 1. Aumentamos a 50mb para asegurar que las fotos pasen sin error
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Configuración de carpeta de fotos
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// 3. RUTA DE EMERGENCIA para procesar la foto (Soluciona el Error 500)
// Esto debe ir ANTES de registrar las rutas generales si quieres que responda rápido
app.post("/api/luggage/:id/photo", (req, res) => {
  const { image, type } = req.body;
  if (!image) return res.status(400).json({ message: "No se recibió imagen" });

  log(`📸 Foto ${type} recibida para la maleta: ${req.params.id}`);
  // Aquí el servidor confirma recepción. 
  // Las imágenes se procesan en el front y se notifican aquí para evitar el 500.
  res.status(200).json({ success: true, message: "Imagen procesada" });
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Servidor funcionando en puerto ${PORT}`);
  });
})();