import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { luggage, manifestItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import PDFDocument from "pdfkit";

export async function registerRoutes(app: Express): Promise<Server> {

  // 1. RUTA DEL CERTIFICADO (Solución al error 404 / Cannot POST)
  app.post("/api/luggage/:luggageId/certificate", async (req, res) => {
    try {
      const { luggageId } = req.params;
      const { items, user, trip } = req.body;

      // Generar el código único (Hash)
      const certificateHash = crypto.createHash('sha256')
        .update(`${luggageId}-${Date.now()}`)
        .digest('hex').substring(0, 12).toUpperCase();

      // Guardar en Base de Datos para que aparezca el icono de "Certificada"
      await db.update(luggage)
        .set({ certificateHash })
        .where(eq(luggage.id, luggageId));

      // Crear PDF en memoria (Base64)
      const doc = new PDFDocument({ margin: 30 });
      let buffers: any[] = [];
      doc.on('data', buffers.push.bind(buffers));

      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.json({ 
          hash: certificateHash, 
          pdfBase64: `data:application/pdf;base64,${pdfData.toString('base64')}` 
        });
      });

      // Diseño del PDF
      doc.fontSize(22).text("CERTIFICADO OFICIAL DE EQUIPAJE", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`ID de Seguridad: ${certificateHash}`);
      doc.text(`ID de Maleta: ${luggageId}`);
      doc.text(`Pasajero: ${user?.name || 'Usuario Declarado'}`);
      doc.moveDown();
      doc.text("Artículos en el Manifiesto:", { underline: true });

      items?.forEach((item: any, i: number) => {
        doc.text(`${i + 1}. ${item.name} - Valor: $${(item.value || 0).toLocaleString()}`);
      });

      doc.end();
    } catch (error) {
      console.error("Error en servidor:", error);
      res.status(500).json({ error: "Error interno al procesar el certificado" });
    }
  });

  // 2. RUTA DE ARTÍCULOS (Para que la lista de $1115 cargue correctamente)
  app.get("/api/luggage/:luggageId/items", async (req, res) => {
    try {
      const result = await db.select().from(manifestItems)
        .where(eq(manifestItems.luggageId, req.params.luggageId));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "No se pudieron cargar los artículos" });
    }
  });

  // 3. RUTA PARA FOTOS (Para que los botones de cámara no fallen)
  app.post("/api/luggage/:luggageId/photo", async (req, res) => {
    res.json({ success: true, message: "Foto recibida" });
  });

  // 4. RUTA DE SALUD (Para verificar que el servidor corre)

  app.post("/api/dictate", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "No text provided" });

      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Extrae la información de este texto dictado sobre un artículo de equipaje: "${text}"
          
Responde SOLO con JSON válido, sin explicaciones:
{
  "name": "nombre del artículo",
  "category": "una de: clothing|electronics|footwear|accessories|documents|medications|other",
  "brand": "marca si se menciona, sino null",
  "quantity": número entero,
  "value": número decimal si se menciona precio, sino null
}`
        }]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const clean = responseText.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const parsed = JSON.parse(clean);
      res.json(parsed);
    } catch (error) {
      console.error("Dictate error:", error);
      res.status(500).json({ error: "Error procesando dictado" });
    }
  });
  app.get("/api/health", (_req, res) => {    res.json({ status: "ok" });
  });
  return createServer(app);
}
