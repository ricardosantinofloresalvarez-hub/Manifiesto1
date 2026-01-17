import { Router } from "express";
import { db } from "./db";
import { luggage, manifestItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const router = Router();

router.get("/:luggageId/certificate", async (req, res) => {
  console.log("🔥 CERTIFICATE ENDPOINT HIT");

  try {
    const { luggageId } = req.params;

    const [lug] = await db
      .select()
      .from(luggage)
      .where(eq(luggage.id, luggageId));

    if (!lug) {
      // Intentar buscar sin prefijo si falla o viceversa, o simplemente loguear
      console.log("🔍 Intentando buscar maleta con ID:", luggageId);
      return res.status(404).send(`Maleta no encontrada: ${luggageId}`);
    }

    const items = await db
      .select()
      .from(manifestItems)
      .where(eq(manifestItems.luggageId, luggageId));

    const hash = crypto
      .createHash("sha256")
      .update(luggageId + Date.now())
      .digest("hex");

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=certificate-${luggageId}.pdf`,
    );

    doc.pipe(res);

    // -------- CONTENIDO DEL PDF --------
    doc.fontSize(18).text("Certificado de Equipaje", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`ID Maleta: ${luggageId}`);
    doc.moveDown();

    doc.text("Artículos:");
    doc.moveDown(0.5);

    items.forEach((item, i) => {
      doc.text(`${i + 1}. ${item.name} (x${item.quantity}) - $${item.value ?? 0}`);
    });

    doc.moveDown();

    // Fotos (si existen)
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
    doc.fontSize(14).text("Verificación de Seguridad", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Hash de Verificación: ${hash}`, { align: "center" });
    doc.moveDown();
    doc.image(qrData, { fit: [200, 200], align: "center" });

    // -------- FIN PDF --------
    doc.end();
  } catch (err: any) {
    console.error("❌ ERROR EN GENERACIÓN PDF:", err);
    res.status(500).send(`Error generando certificado: ${err.message}`);
  }
});

export default router;
