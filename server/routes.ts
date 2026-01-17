import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import { db } from "./db";
import { manifestItems, luggage } from "@shared/schema";
import { eq } from "drizzle-orm";

// 🔥 IMPORTAMOS EL ROUTER DE MANIFEST ITEMS
import manifestItemsRouter from "./manifestItems";

/* ─────────────────────────────────────────────
   CONFIGURACIÓN UPLOADS
───────────────────────────────────────────── */

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomUUID();
    cb(null, `${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ─────────────────────────────────────────────
   ROUTES
───────────────────────────────────────────── */

export async function registerRoutes(app: Express): Promise<Server> {
  /* ───── SERVIR UPLOADS ───── */
  app.use("/uploads", express.static(uploadsDir));

  /* ───── MANIFEST ITEMS (🔥 CLAVE) ───── */
  app.use("/api/manifestItems", manifestItemsRouter);
  
  // 🔥 IMPORTAMOS EL ROUTER DE LUGGAGE (CERTIFICADOS GET)
  const luggageRoutes = (await import("./luggageRoutes")).default;
  app.use("/api/luggage", luggageRoutes);

  console.log("✅ Rutas de equipaje montadas en /api/luggage");

  /* ───── SUBIR FOTO MALETA ───── */
  app.post(
    "/api/luggage/:luggageId/photo",
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        const { luggageId } = req.params;
        const { type } = req.body;

        if (!req.file) {
          return res.status(400).json({ error: "No se envió imagen" });
        }

        if (type !== "open" && type !== "closed") {
          return res.status(400).json({ error: "Tipo inválido" });
        }

        const photoUrl = `/uploads/${req.file.filename}`;

        if (type === "open") {
          await db
            .update(luggage)
            .set({ openPhotoUrl: photoUrl })
            .where(eq(luggage.id, luggageId));
        } else {
          await db
            .update(luggage)
            .set({ closedPhotoUrl: photoUrl })
            .where(eq(luggage.id, luggageId));
        }

        res.json({ url: photoUrl });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    },
  );

  /* ───── GENERAR CERTIFICADO PDF (LEGACY POST) ───── */
  // Mantenemos esto por compatibilidad si el frontend lo usa, pero no es el objetivo
  app.post(
    "/api/luggage/:luggageId/certificate",
    async (req: Request, res: Response) => {
      console.log("🔥 ENTRO AL ENDPOINT CERTIFICATE", req.params.luggageId);
      try {
        const { luggageId } = req.params;

        const [lug] = await db
          .select()
          .from(luggage)
          .where(eq(luggage.id, luggageId));

        if (!lug) {
          return res.status(404).json({ error: "Maleta no encontrada" });
        }

        const items = await db
          .select()
          .from(manifestItems)
          .where(eq(manifestItems.luggageId, luggageId));

        const hash = crypto
          .createHash("sha256")
          .update(luggageId + Date.now())
          .digest("hex");

        const pdfName = `certificate-${luggageId}.pdf`;
        const pdfPath = path.join(uploadsDir, pdfName);

        const doc = new PDFDocument({ margin: 40 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        doc.fontSize(18).text("Certificado de Equipaje", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text(`ID Maleta: ${luggageId}`);
        doc.text(`Hash: ${hash}`);
        doc.moveDown();

        doc.text("Artículos:");
        doc.moveDown(0.5);

        items.forEach((item, i) => {
          doc.text(
            `${i + 1}. ${item.name} (x${item.quantity}) - $${item.value ?? 0}`,
          );
        });

        doc.moveDown();

        if (lug.openPhotoUrl) {
          const imgPath = path.join(process.cwd(), lug.openPhotoUrl);
          if (fs.existsSync(imgPath)) {
            doc.addPage();
            doc.text("Foto Maleta Abierta");
            doc.image(imgPath, { fit: [400, 400], align: "center" });
          }
        }

        if (lug.closedPhotoUrl) {
          const imgPath = path.join(process.cwd(), lug.closedPhotoUrl);
          if (fs.existsSync(imgPath)) {
            doc.addPage();
            doc.text("Foto Maleta Cerrada");
            doc.image(imgPath, { fit: [400, 400], align: "center" });
          }
        }

        const qrData = await QRCode.toDataURL(hash);
        doc.addPage();
        doc.text("Verificación");
        doc.image(qrData, { fit: [200, 200] });

        doc.end();

        await new Promise((resolve) => stream.on("finish", resolve));

        const pdfUrl = `/uploads/${pdfName}`;

        await db
          .update(luggage)
          .set({
            certificateHash: hash,
            certificatePdfUrl: pdfUrl,
          })
          .where(eq(luggage.id, luggageId));

        res.json({ hash, pdf: pdfUrl });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
