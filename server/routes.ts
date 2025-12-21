import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { createHash } from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.patch("/api/trips/:tripId/photos", async (req, res) => {
    try {
      const { tripId } = req.params;
      const { openPhotoUrl, closedPhotoUrl } = req.body;

      if (!tripId) {
        return res.status(400).json({ error: "Trip ID is required" });
      }

      res.json({
        tripId,
        openPhotoUrl: openPhotoUrl || null,
        closedPhotoUrl: closedPhotoUrl || null,
      });
    } catch (error: any) {
      console.error('Error updating trip photos:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trips/:tripId/certificate", async (req, res) => {
    try {
      const { trip, items, user } = req.body;

      console.log('🔍 ===== CERTIFICATE GENERATION DEBUG =====');
      console.log('📸 Trip openPhotoUrl:', trip?.openPhotoUrl || 'NOT PROVIDED');
      console.log('📸 Trip closedPhotoUrl:', trip?.closedPhotoUrl || 'NOT PROVIDED');
      console.log('🔍 ==========================================');

      if (!trip || !items || !user) {
        return res.status(400).json({ error: "Missing required data: trip, items, user" });
      }

      const itemCount = items.length;
      const totalValue = items.reduce((sum: number, item: any) => sum + (item.estimatedValue || 0), 0);

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

      const hash = createHash('sha256').update(manifestData).digest('hex');

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));

      await new Promise<void>(async (resolve, reject) => {
        doc.on('end', () => resolve());
        doc.on('error', reject);

        doc.fontSize(24).font('Helvetica-Bold').text('Manifiesto Certificado', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Información del Viaje');
        doc.fontSize(12).font('Helvetica')
          .text(`Título: ${trip.title}`)
          .text(`Destino: ${trip.destination}`)
          .text(`Fechas: ${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`)
          .text(`Usuario: ${user.name} (${user.email})`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Resumen');
        doc.fontSize(12).font('Helvetica')
          .text(`Total de artículos: ${itemCount}`)
          .text(`Valor total estimado: $${totalValue.toLocaleString()}`);
        doc.moveDown();

        if (trip.openPhotoUrl || trip.closedPhotoUrl) {
          console.log('📸 Adding luggage photos section to PDF...');
          doc.addPage();
          doc.fontSize(18).font('Helvetica-Bold').text('Fotografías del Equipaje', { align: 'center' });
          doc.moveDown(2);

          if (trip.openPhotoUrl) {
            try {
              console.log('📥 Fetching open photo...');
              doc.fontSize(14).font('Helvetica-Bold').text('Maleta Abierta:', { align: 'center' });
              doc.moveDown(0.5);

              const response = await fetch(trip.openPhotoUrl);
              console.log('📥 Open photo response status:', response.status);

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              console.log('📥 Open photo buffer size:', buffer.length, 'bytes');

              doc.image(buffer, {
                fit: [400, 300],
                align: 'center',
                valign: 'center'
              });
              doc.moveDown(2);

              console.log('✅ Open photo added to PDF successfully');
            } catch (error: any) {
              console.error('❌ Error adding open photo:', error.message);
              doc.fontSize(10).font('Helvetica').fillColor('red')
                .text('(Error: No se pudo cargar la foto de maleta abierta)', { align: 'center' })
                .fillColor('black');
              doc.moveDown();
            }
          }

          if (trip.closedPhotoUrl) {
            try {
              console.log('📥 Fetching closed photo...');
              doc.fontSize(14).font('Helvetica-Bold').text('Maleta Cerrada:', { align: 'center' });
              doc.moveDown(0.5);

              const response = await fetch(trip.closedPhotoUrl);
              console.log('📥 Closed photo response status:', response.status);

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              console.log('📥 Closed photo buffer size:', buffer.length, 'bytes');

              doc.image(buffer, {
                fit: [400, 300],
                align: 'center',
                valign: 'center'
              });
              doc.moveDown(2);

              console.log('✅ Closed photo added to PDF successfully');
            } catch (error: any) {
              console.error('❌ Error adding closed photo:', error.message);
              doc.fontSize(10).font('Helvetica').fillColor('red')
                .text('(Error: No se pudo cargar la foto de maleta cerrada)', { align: 'center' })
                .fillColor('black');
              doc.moveDown();
            }
          }

          doc.addPage();
        } else {
          console.log('⚠️ No luggage photos provided');
        }

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

        doc.addPage();

        doc.fontSize(14).font('Helvetica-Bold').text('Certificación', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica')
          .text('Este manifiesto ha sido certificado mediante hash SHA-256:', { align: 'center' })
          .moveDown(0.5);

        doc.fontSize(8).font('Helvetica')
          .text(hash, { align: 'center' })
          .moveDown(2);

        doc.fontSize(10).font('Helvetica-Bold').text('Escanea para verificar:', { align: 'center' });
        doc.moveDown(1);

        try {
          const qrBuffer = await QRCode.toBuffer(
            `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/verify?hash=${hash}`,
            {
              width: 200,
              margin: 2,
              errorCorrectionLevel: 'M'
            }
          );

          const qrSize = 150;
          const pageWidth = doc.page.width;
          const xPosition = (pageWidth - qrSize) / 2;

          // Posición actual donde pondremos el QR
          const qrStartY = doc.y;

          // Insertamos QR
          doc.image(qrBuffer, xPosition, qrStartY, {
            width: qrSize,
            height: qrSize
          });

          // FORZAMOS a PDFKit a bajar más allá del QR
          doc.y = qrStartY + qrSize + 25;
          doc.moveDown(1);

        } catch (error: any) {
          console.error('❌ Error generating QR code:', error);
          doc.fontSize(8).text('(Error al generar código QR)', { align: 'center' });
          doc.moveDown();
        }


        // Now add the generated date AFTER moving past the QR
        doc.fontSize(9).font('Helvetica').text(`Generado el ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);

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

  app.get("/api/verify/:hash", async (req, res) => {
    const hash = req.params.hash;

    if (!hash || hash.length !== 64) {
      return res.json({ valid: false, error: "Invalid hash format" });
    }

    res.json({ 
      requiresLookup: true,
      hash 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}