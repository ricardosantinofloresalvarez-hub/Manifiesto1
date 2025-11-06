import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { createHash } from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Image upload endpoint
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      res.json({ url: base64Image });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PDF Certificate Generation - receives all data in request body
  app.post("/api/trips/:tripId/certificate", async (req, res) => {
    try {
      const { trip, items, user } = req.body;

      if (!trip || !items || !user) {
        return res.status(400).json({ error: "Missing required data: trip, items, user" });
      }

      // Calculate totals
      const itemCount = items.length;
      const totalValue = items.reduce((sum: number, item: any) => sum + (item.estimatedValue || 0), 0);

      // Create manifest data
      const manifestData = JSON.stringify({
        tripId: trip.id,
        tripTitle: trip.title,
        destination: trip.destination,
        userId: trip.userId,
        userName: user.name || "Unknown",
        items: items.map((item: any) => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          estimatedValue: item.estimatedValue,
          serialNumber: item.serialNumber,
          luggageBrand: item.luggageBrand,
          luggageSize: item.luggageSize,
          isSealed: item.isSealed,
          isLocked: item.isLocked,
        })),
        timestamp: new Date().toISOString(),
      });

      // Generate hash
      const hash = createHash('sha256').update(manifestData).digest('hex');

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(`${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/verify?hash=${hash}`);

      // Generate PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      
      await new Promise<void>((resolve, reject) => {
        doc.on('end', () => resolve());
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Manifiesto Certificado', { align: 'center' });
        doc.moveDown();

        // Trip info
        doc.fontSize(14).font('Helvetica-Bold').text('Información del Viaje');
        doc.fontSize(12).font('Helvetica')
          .text(`Título: ${trip.title}`)
          .text(`Destino: ${trip.destination}`)
          .text(`Fechas: ${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`)
          .text(`Usuario: ${user.name} (${user.email})`);
        doc.moveDown();

        // Summary
        doc.fontSize(14).font('Helvetica-Bold').text('Resumen');
        doc.fontSize(12).font('Helvetica')
          .text(`Total de artículos: ${itemCount}`)
          .text(`Valor total estimado: $${totalValue.toLocaleString()}`);
        doc.moveDown();

        // Items list
        doc.fontSize(14).font('Helvetica-Bold').text('Lista de Artículos');
        doc.moveDown(0.5);

        items.forEach((item: any, index: number) => {
          doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${item.name}`);
          doc.fontSize(10).font('Helvetica')
            .text(`   Categoría: ${item.category}`)
            .text(`   Cantidad: ${item.quantity}`)
            .text(`   Valor estimado: $${(item.estimatedValue || 0).toLocaleString()}`);
          
          if (item.serialNumber) {
            doc.text(`   Número de serie: ${item.serialNumber}`);
          }

          // Luggage metadata
          if (item.luggageBrand || item.luggageSize || item.isSealed || item.isLocked) {
            doc.fontSize(10).font('Helvetica-Bold').text(`   Detalles del Equipaje:`);
            if (item.luggageBrand) {
              doc.fontSize(10).font('Helvetica').text(`   - Marca: ${item.luggageBrand}`);
            }
            if (item.luggageSize) {
              const sizeMap: any = {
                small: 'Pequeña',
                medium: 'Mediana',
                large: 'Grande',
                xlarge: 'Extra Grande'
              };
              doc.text(`   - Tamaño: ${sizeMap[item.luggageSize] || item.luggageSize}`);
            }
            if (item.isSealed) {
              doc.text(`   - Estado: Sellada`);
            }
            if (item.isLocked) {
              doc.text(`   - Seguridad: Con Candado`);
            }
          }
          
          doc.moveDown(0.5);
        });

        doc.moveDown();

        // Certification
        doc.fontSize(14).font('Helvetica-Bold').text('Certificación');
        doc.fontSize(10).font('Helvetica')
          .text('Este manifiesto ha sido certificado mediante hash SHA-256:')
          .fontSize(8)
          .text(hash, { align: 'center' })
          .moveDown();

        // QR Code
        doc.fontSize(10).text('Escanea para verificar:', { align: 'center' });
        doc.image(qrCodeDataURL, {
          fit: [150, 150],
          align: 'center',
        });

        doc.moveDown();
        doc.fontSize(8).text(`Generado el ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);

      // Return both PDF and certificate data for frontend to save
      res.json({
        pdf: pdfBuffer.toString('base64'),
        certificate: {
          tripId: trip.id,
          hash,
          manifestData,
          itemCount,
          totalValue,
          verified: true,
        }
      });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Certificate verification endpoint - expects certificate data in query or looks it up
  app.get("/api/verify/:hash", async (req, res) => {
    // This endpoint will be called from the Verify page
    // The frontend will pass the certificate data from Firestore
    // For now, we just validate the hash format
    const hash = req.params.hash;
    
    if (!hash || hash.length !== 64) {
      return res.json({ valid: false, error: "Invalid hash format" });
    }

    // Return a response indicating the frontend should look up the certificate
    res.json({ 
      requiresLookup: true,
      hash 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
