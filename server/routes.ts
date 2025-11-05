import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTripSchema, 
  insertManifestItemSchema,
  insertUserSchema 
} from "@shared/schema";
import { createHash } from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

async function validateTripOwnership(req: Request, res: Response, next: NextFunction) {
  const tripId = req.params.id || req.params.tripId;
  const userId = req.body.userId || req.query.userId as string;
  
  if (!userId) {
    return res.status(401).json({ error: "User ID required" });
  }
  
  if (tripId) {
    const trip = await storage.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    if (trip.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
  }
  
  next();
}

async function validateItemOwnership(req: Request, res: Response, next: NextFunction) {
  const itemId = req.params.id;
  const userId = req.body.userId || req.query.userId as string;
  
  if (!userId) {
    return res.status(401).json({ error: "User ID required" });
  }
  
  const item = await storage.getManifestItem(itemId);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  
  const trip = await storage.getTrip(item.tripId);
  if (!trip || trip.userId !== userId) {
    return res.status(403).json({ error: "Access denied" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:email", async (req, res) => {
    const user = await storage.getUserByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // Trip routes
  app.get("/api/trips", validateTripOwnership, async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    const trips = await storage.getTripsByUserId(userId);
    
    // For each trip, get item count
    const tripsWithCounts = await Promise.all(
      trips.map(async (trip) => {
        const items = await storage.getManifestItemsByTripId(trip.id);
        const certificates = await storage.getCertificatesByTripId(trip.id);
        return {
          ...trip,
          itemCount: items.length,
          verified: certificates.length > 0,
        };
      })
    );
    
    res.json(tripsWithCounts);
  });

  app.get("/api/trips/:id", validateTripOwnership, async (req, res) => {
    const trip = await storage.getTrip(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    
    const items = await storage.getManifestItemsByTripId(trip.id);
    const certificates = await storage.getCertificatesByTripId(trip.id);
    
    res.json({
      ...trip,
      itemCount: items.length,
      verified: certificates.length > 0,
    });
  });

  app.post("/api/trips", async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/trips/:id", validateTripOwnership, async (req, res) => {
    try {
      const updateData = insertTripSchema.partial().parse(req.body);
      const trip = await storage.updateTrip(req.params.id, updateData);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/trips/:id", validateTripOwnership, async (req, res) => {
    const deleted = await storage.deleteTrip(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json({ success: true });
  });

  // Manifest Item routes
  app.get("/api/trips/:tripId/items", validateTripOwnership, async (req, res) => {
    const items = await storage.getManifestItemsByTripId(req.params.tripId);
    res.json(items);
  });

  app.post("/api/trips/:tripId/items", validateTripOwnership, async (req, res) => {
    try {
      const itemData = insertManifestItemSchema.parse({
        ...req.body,
        tripId: req.params.tripId,
      });
      const item = await storage.createManifestItem(itemData);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/items/:id", validateItemOwnership, async (req, res) => {
    try {
      const updateData = insertManifestItemSchema.partial().parse(req.body);
      const item = await storage.updateManifestItem(req.params.id, updateData);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/items/:id", validateItemOwnership, async (req, res) => {
    const deleted = await storage.deleteManifestItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ success: true });
  });

  // Image upload route
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Convert to base64 for in-memory storage
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.json({ imageUrl: base64Image });
  });

  // Certificate generation route
  app.post("/api/trips/:tripId/certificate", validateTripOwnership, async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const items = await storage.getManifestItemsByTripId(req.params.tripId);
      const user = await storage.getUser(trip.userId);

      // Calculate totals
      const itemCount = items.length;
      const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

      // Create manifest data
      const manifestData = JSON.stringify({
        tripId: trip.id,
        tripTitle: trip.title,
        destination: trip.destination,
        userId: trip.userId,
        userName: user?.name || "Unknown",
        items: items.map(item => ({
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

      // Save certificate
      const certificate = await storage.createCertificate({
        tripId: trip.id,
        hash,
        manifestData,
        itemCount,
        totalValue,
        verified: true,
      });

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
          .text(`Fechas: ${trip.startDate} - ${trip.endDate}`)
          .text(`Usuario: ${user?.name || 'Unknown'}`)
          .moveDown();

        // Manifest summary
        doc.fontSize(14).font('Helvetica-Bold').text('Resumen del Manifiesto');
        doc.fontSize(12).font('Helvetica')
          .text(`Total de artículos: ${itemCount}`)
          .text(`Valor total estimado: $${totalValue.toLocaleString()}`)
          .moveDown();

        // Items list
        doc.fontSize(14).font('Helvetica-Bold').text('Artículos');
        doc.fontSize(10).font('Helvetica');
        
        items.forEach((item, index) => {
          let itemText = `${index + 1}. ${item.name} (${item.category}) - Cantidad: ${item.quantity}`;
          if (item.estimatedValue) itemText += ` - Valor: $${item.estimatedValue}`;
          if (item.serialNumber) itemText += ` - S/N: ${item.serialNumber}`;
          if (item.luggageBrand) {
            const sizeMap: Record<string, string> = {
              small: 'Pequeña',
              medium: 'Mediana',
              large: 'Grande',
              xlarge: 'Extra Grande'
            };
            const sizeLabel = item.luggageSize ? sizeMap[item.luggageSize] || item.luggageSize : '';
            itemText += ` - Maleta: ${item.luggageBrand}${sizeLabel ? ` (${sizeLabel})` : ''}`;
          }
          const security: string[] = [];
          if (item.isSealed) security.push('Sellada');
          if (item.isLocked) security.push('Con Candado');
          if (security.length > 0) itemText += ` - ${security.join(', ')}`;
          doc.text(itemText);
        });

        doc.moveDown();

        // Verification section
        doc.fontSize(14).font('Helvetica-Bold').text('Verificación');
        doc.fontSize(10).font('Helvetica')
          .text(`Hash SHA-256: ${hash}`)
          .text(`Fecha de certificación: ${new Date().toLocaleString('es-ES')}`)
          .moveDown();

        // QR Code
        doc.fontSize(12).font('Helvetica-Bold').text('Código QR de Verificación:', { align: 'center' });
        const qrImageBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
        doc.image(qrImageBuffer, { fit: [200, 200], align: 'center' });

        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);

      res.json({
        certificate,
        pdfUrl: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
        qrCode: qrCodeDataURL,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verification route
  app.get("/api/verify/:hash", async (req, res) => {
    const certificate = await storage.getCertificateByHash(req.params.hash);
    
    if (!certificate) {
      return res.json({ valid: false });
    }

    const trip = await storage.getTrip(certificate.tripId);
    const user = trip ? await storage.getUser(trip.userId) : undefined;
    
    // Parse manifestData to include full item details with luggage metadata
    let manifestItems = [];
    try {
      const parsedData = JSON.parse(certificate.manifestData);
      manifestItems = parsedData.items || [];
    } catch (e) {
      // If parsing fails, continue with empty array
    }

    res.json({
      valid: true,
      manifestId: certificate.id,
      userName: user?.name,
      tripTitle: trip?.title,
      destination: trip?.destination,
      itemCount: certificate.itemCount,
      totalValue: certificate.totalValue,
      items: manifestItems,
      timestamp: certificate.createdAt,
      hash: certificate.hash,
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
