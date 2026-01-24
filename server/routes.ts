import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { db } from "./db";
import { manifestItems, luggage } from "@shared/schema"; 
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // 1. OBTENER ARTÍCULOS
  app.get("/api/manifestItems", async (req: Request, res: Response) => {
    try {
      const { luggageId } = req.query;
      if (!luggageId) return res.json([]);
      const items = await db.select().from(manifestItems).where(eq(manifestItems.luggageId, Number(luggageId)));
      res.json(items);
    } catch (err) {
      res.status(500).json([]);
    }
  });

  // 2. AGREGAR ARTÍCULOS
  app.post("/api/manifestItems", async (req: Request, res: Response) => {
    try {
      const newItem = await db.insert(manifestItems).values(req.body).returning();
      res.status(201).json(newItem[0]);
    } catch (err) {
      res.status(500).json({ error: "Error al guardar" });
    }
  });

  // 3. VERIFICACIÓN (Match del QR)
  app.get("/api/luggage/verify/:hash", async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      const found = await db.select().from(luggage).where(eq(luggage.certificateHash, hash));
      if (found.length > 0) {
        return res.json({ ...found[0], verified: true });
      }
      return res.status(404).json({ verified: false });
    } catch (err) {
      return res.status(500).json({ verified: false });
    }
  });

  // 4. GENERACIÓN DE PDF CERTIFICADO
  app.post("/api/luggage/:luggageId/certificate", async (req: Request, res: Response) => {
    const { luggageId } = req.params;
    const { items, trip, user } = req.body;
    try {
      const certificateHash = crypto.createHash("sha256").update(luggageId + Date.now()).digest("hex");
      await db.update(luggage).set({ certificateHash }).where(eq(luggage.id, Number(luggageId)));

      const doc = new PDFDocument({ margin: 40 });
      let buffers: any[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        res.json({ 
          hash: certificateHash, 
          pdfBase64: `data:application/pdf;base64,${pdfData.toString('base64')}` 
        });
      });

      doc.fontSize(22).text("DECLARACIÓN DE EQUIPAJE", { align: "center" });
      doc.moveDown().fontSize(12).text(`Pasajero: ${user?.name || 'Ricardo E. Flores'}`);
      doc.text(`ID Maleta: ${luggageId}`).moveDown();

      let total = 0;
      items?.forEach((item: any, i: number) => {
        const val = Number(item.value) || 0;
        total += val;
        doc.text(`${i + 1}. ${item.name} - $${val.toLocaleString()}`);
      });
      doc.moveDown().fontSize(16).text(`TOTAL: $${total.toLocaleString()}`, { stroke: true });

      doc.addPage();
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(2).strokeColor("#cccccc").stroke();
      doc.moveDown(4).fontSize(24).fillColor("#2c3e50").text("Certificación Oficial", { align: "center" });
      doc.moveDown().fontSize(10).fillColor("#7f8c8d").text(certificateHash, { align: "center" });

      const qrSize = 180;
      const qrData = await QRCode.toDataURL(certificateHash);
      doc.image(qrData, (doc.page.width - qrSize) / 2, doc.y + 10, { width: qrSize });

      doc.end();
    } catch (err) {
      res.status(500).send("Error");
    }
  });

  return createServer(app);
}