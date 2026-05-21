import { Router } from "express";
import { db } from "./db";
import { luggage, manifestItems, trips, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const router = Router();

// LISTAR Y CREAR (Básico)
router.get("/", async (req, res) => {
  const { tripId } = req.query;
  const results = await db.select().from(luggage).where(eq(luggage.tripId, String(tripId)));
  res.json(results);
});

router.post("/", async (req, res) => {
  const [newItem] = await db.insert(luggage).values(req.body).returning();
  res.json(newItem);
});

// CERTIFICADO CON FOTOS
router.get("/:luggageId/certificate", async (req, res) => {
  try {
    const { luggageId } = req.params;
    const lang = (req.query.lang as string) || 'es'; // Detectar idioma (default: español)

    const [lug] = await db.select().from(luggage).where(eq(luggage.id, luggageId));
    if (!lug) return res.status(404).send("Maleta no encontrada");

    const [trip] = await db.select().from(trips).where(eq(trips.id, lug.tripId));

    let userName = req.query.userName as string || "Usuario";
    if (userName === "Usuario" && trip) {
      const [user] = await db.select().from(users).where(eq(users.id, trip.userId));
      if (user) userName = user.name;
    }

    const items = await db.select().from(manifestItems).where(eq(manifestItems.luggageId, luggageId));

    // Verificar y descontar créditos
    if (trip) {
      const [currentUser] = await db.select().from(users).where(eq(users.id, trip.userId));
      if (currentUser) {
        const isAnnual = currentUser.planType === 'annual' && currentUser.planExpiresAt && new Date(currentUser.planExpiresAt) > new Date();
        const hasCredits = (currentUser.manifestCredits || 0) > 0;
        if (!isAnnual && !hasCredits) {
          const msg = lang === 'en' 
            ? 'You have no manifests available. Please purchase a plan to continue.'
            : 'No tienes manifiestos disponibles. Adquiere un plan para continuar.';
          return res.status(403).json({ error: msg });
        }
        const alreadyCertified = !!(lug.certificateHash);
        if (!isAnnual && !alreadyCertified) {
          await db.update(users).set({
            manifestCredits: Math.max(0, (currentUser.manifestCredits || 0) - 1)
          }).where(eq(users.id, trip.userId));
        }
      }
    }

    const hash = crypto.createHash("sha256").update(`${luggageId}-${Date.now()}`).digest("hex").substring(0, 32);
    await db.update(luggage).set({ certificateHash: hash }).where(eq(luggage.id, luggageId));

    // TEXTOS TRADUCIDOS
    const texts = {
      es: {
        title: "MANIFIESTO DE EQUIPAJE",
        ownerInfo: "Información del Propietario",
        owner: "Propietario",
        luggage: "Maleta",
        trackingId: "ID de Seguimiento",
        luggageDetails: "Detalles de la Maleta",
        brand: "Marca",
        size: "Tamaño",
        type: "Tipo",
        color: "Color",
        sealed: "Sellada",
        locked: "Con Candado",
        yes: "Sí",
        no: "No",
        declaredContents: "Contenido Declarado",
        item: "Artículo",
        category: "Categoría",
        quantity: "Cantidad",
        value: "Valor",
        totalValue: "Valor Total Declarado",
        verification: "Verificación",
        certificate: "Certificado",
        hash: "Hash de Verificación",
        scanQR: "Escanea el código QR para verificar la autenticidad",
        declaration: "Este documento certifica que el contenido declarado corresponde a la información registrada en la fecha de emisión.",
        photos: "Fotografías del Equipaje",
        openPhoto: "Maleta Abierta",
        closedPhoto: "Maleta Cerrada",
        // AGREGAR AL FINAL, antes de cerrar 'es':
          categories: {
            accessories: "Accesorios",
            electronics: "Electrónicos",
            footwear: "Calzado",
            clothing: "Ropa",
            toiletries: "Artículos de aseo",
            documents: "Documentos",
            sports: "Deportes",
            books: "Libros",
            toys: "Juguetes",
            food: "Alimentos",
            other: "Otros"
          }
        },
      en: {
        title: "LUGGAGE MANIFEST",
        ownerInfo: "Owner Information",
        owner: "Owner",
        luggage: "Luggage",
        trackingId: "Tracking ID",
        luggageDetails: "Luggage Details",
        brand: "Brand",
        size: "Size",
        type: "Type",
        color: "Color",
        sealed: "Sealed",
        locked: "Locked",
        yes: "Yes",
        no: "No",
        declaredContents: "Declared Contents",
        item: "Item",
        category: "Category",
        quantity: "Quantity",
        value: "Value",
        totalValue: "Total Declared Value",
        verification: "Verification",
        certificate: "Certificate",
        hash: "Verification Hash",
        scanQR: "Scan the QR code to verify authenticity",
        declaration: "This document certifies that the declared contents correspond to the information registered on the date of issue.",
        photos: "Luggage Photographs",
        openPhoto: "Open Luggage",
        closedPhoto: "Closed Luggage",
         // AGREGAR AL FINAL, antes de cerrar 'en':
            categories: {
              accessories: "Accessories",
              electronics: "Electronics",
              footwear: "Footwear",
              clothing: "Clothing",
              toiletries: "Toiletries",
              documents: "Documents",
              sports: "Sports",
              books: "Books",
              toys: "Toys",
              food: "Food",
              other: "Other"
            }
          }
        };

    const t = texts[lang as 'es' | 'en'] || texts.es; // Usar textos según idioma

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Certificate_${luggageId}.pdf"`);
    doc.pipe(res);

    // PÁGINA 1
    doc.rect(0, 0, 612, 60).fill("#0f172a");
    doc.fillColor("#ffffff").fontSize(18).text(t.title, 50, 22, { align: "center" });
    try {
      const logoPath = require("path").join(process.cwd(), "dist/public/Manifiesto_logo_jpg.png");
      doc.image(logoPath, 540, 8, { width: 44, height: 44 });
    } catch(e) {}
    doc.fillColor("#000000").fontSize(12).moveDown(4);

    doc.font("Helvetica-Bold").fontSize(14).text(t.ownerInfo, { underline: true });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);
    doc.text(`${t.owner}: ${userName}`);
    doc.text(`${t.luggage}: ${lug.nickname || 'N/A'}`);
    doc.text(`${t.trackingId}: ${luggageId}`);
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(14).text(t.luggageDetails, { underline: true });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);

    if (lug.brand) doc.text(`${t.brand}: ${lug.brand}`);
    if (lug.color) doc.text(`${t.color}: ${lug.color}`);

    if (lug.size) {
      const sizeMap: any = {
        es: { small: 'Pequeña', medium: 'Mediana', large: 'Grande', xlarge: 'Extra Grande' },
        en: { small: 'Small', medium: 'Medium', large: 'Large', xlarge: 'Extra Large' }
      };
      const sizes = sizeMap[lang] || sizeMap.es;
      doc.text(`${t.size}: ${sizes[lug.size] || lug.size}`);
    }

    if (lug.type) {
      const typeMap: any = {
        es: { cabin: 'Cabina', checked: 'Documentada', backpack: 'Mochila', handbag: 'Bolso de mano' },
        en: { cabin: 'Cabin', checked: 'Checked', backpack: 'Backpack', handbag: 'Handbag' }
      };
      const types = typeMap[lang] || typeMap.es;
      doc.text(`${t.type}: ${types[lug.type] || lug.type}`);
    }

    if (lug.isSealed) doc.text(`${t.sealed}: ${t.yes} ✓`);
    if (lug.isLocked) doc.text(`${t.locked}: ${t.yes} ✓`);
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(14).text(t.declaredContents, { underline: true });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10);

    if (items.length === 0) {
      const noItems = lang === 'en' 
        ? "No items registered in this luggage."
        : "No hay artículos registrados en esta maleta.";
      doc.text(noItems);
    } else {
      items.forEach((item, i) => {
        doc.font("Helvetica-Bold").text(`${i + 1}. ${item.name}`);
        doc.font("Helvetica");
        const translatedCategory = t.categories[item.category as keyof typeof t.categories] || item.category;
        doc.text(`   ${t.category}: ${translatedCategory}`);
        if (item.brand) doc.text(`   ${t.brand}: ${item.brand}`);
        doc.text(`   ${t.quantity}: ${item.quantity || 1}`);
        if (item.value) {
          const valueLabel = lang === 'en' ? 'Estimated value' : 'Valor estimado';
          doc.text(`   ${valueLabel}: $${item.value.toLocaleString()}`);
        }
        if (item.serialNumber) {
          const serialLabel = lang === 'en' ? 'Serial number' : 'Número de serie';
          doc.text(`   ${serialLabel}: ${item.serialNumber}`);
        }
        if (item.notes) {
          const notesLabel = lang === 'en' ? 'Notes' : 'Notas';
          doc.text(`   ${notesLabel}: ${item.notes}`);
        }
        doc.moveDown(0.3);
      });
    }

    const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    doc.moveDown();
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`${t.totalValue.toUpperCase()}: $${totalValue.toLocaleString()}`, { align: "right" });
    const totalItemsLabel = lang === 'en' ? 'TOTAL ITEMS' : 'TOTAL DE ARTÍCULOS';
    doc.text(`${totalItemsLabel}: ${totalQuantity}`, { align: "right" });

    // PÁGINA 2: FOTOS
    if (lug.openPhotoUrl || lug.closedPhotoUrl) {
      doc.addPage();
      doc.rect(0, 0, 612, 60).fill("#0f172a");
      doc.fillColor("#ffffff").fontSize(18).text(t.photos, 50, 22, { align: "center" });
      doc.fillColor("#000000").moveDown(4);

      let currentY = doc.y + 20;

      const fetchImage = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch image');
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      };

      try {
        if (lug.openPhotoUrl) {
          doc.fontSize(14).font("Helvetica-Bold").text(`${t.openPhoto}:`, 50, currentY);
          currentY += 30;
          const imageBuffer = await fetchImage(lug.openPhotoUrl);
          doc.image(imageBuffer, 50, currentY, { width: 250, height: 200, fit: [250, 200] });
          currentY += 220;
        }

        if (lug.closedPhotoUrl) {
          if (currentY > 600) {
            doc.addPage();
            currentY = 100;
          }
          doc.fontSize(14).font("Helvetica-Bold").text(`${t.closedPhoto}:`, 50, currentY);
          currentY += 30;
          const imageBuffer = await fetchImage(lug.closedPhotoUrl);
          doc.image(imageBuffer, 50, currentY, { width: 250, height: 200, fit: [250, 200] });
        }
      } catch (error) {
        console.error('Error loading images:', error);
        const errorMsg = lang === 'en' 
          ? "(Error loading photographs)"
          : "(Error al cargar fotografías)";
        doc.fontSize(10).font("Helvetica").text(errorMsg, 50, currentY);
      }
      }

      // PÁGINA FINAL: QR
      doc.addPage();
      doc.rect(0, 0, 612, 60).fill("#0f172a");
      const verificationTitle = lang === 'en' 
      ? "AUTHENTICITY VERIFICATION"
      : "VERIFICACIÓN DE AUTENTICIDAD";
      doc.fillColor("#ffffff").fontSize(18).text(verificationTitle, 50, 22, { align: "center" });
      doc.fillColor("#000000").moveDown(4);

      const hashLabel = lang === 'en' ? "SECURITY HASH:" : "HASH DE SEGURIDAD:";
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000").text(hashLabel, { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(9).font("Courier").text(hash, { align: "center" });
      doc.moveDown(0.4);
      const copyHint = lang === 'en' ? 'Select the hash to copy and verify your certificate' : 'Selecciona el hash para copiar y verificar tu certificado';
      doc.fontSize(8).font("Helvetica").fillColor("#888888").text(copyHint, { align: "center" });
      doc.fillColor("#000000").moveDown(1.5);

      const qrData = await QRCode.toDataURL(`${process.env.BASE_URL || "https://159cf49c-0920-4684-b3d1-58a353686a03-00-32y8k86zgc8mg.worf.replit.dev"}/verify?hash=${hash}`);
      const qrX = (doc.page.width - 180) / 2;
      const qrY = doc.y + 20;
      doc.image(qrData, qrX, qrY, { width: 180 });
      doc.y = qrY + 200;

      // Fecha/hora de emisión — prominente, antes del QR
      const dateLabel = lang === 'en' ? 'Certificate issued on' : 'Fecha de emisión';
      const dateLocale = lang === 'en' ? 'en-US' : 'es-ES';
      const issuedAt = new Date().toLocaleString(dateLocale, { dateStyle: 'full', timeStyle: 'medium' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(`${dateLabel}: ${issuedAt}`, { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(9).font('Helvetica').fillColor('#666666');
      doc.text(t.scanQR, { align: 'center' });
      doc.moveDown(0.5);

      doc.end();
      } catch (err: any) { 
      console.error("Error generando certificado:", err);
      res.status(500).send(err.message); 
      }
      });

      
     // GET HASH
     router.get("/:luggageId/hash", async (req, res) => {
       try {
         const { luggageId } = req.params;
         const [lug] = await db.select().from(luggage).where(eq(luggage.id, luggageId));
         if (!lug) return res.status(404).json({ error: "Not found" });
         res.json({ hash: lug.certificateHash || null });
       } catch (err) {
         res.status(500).json({ error: "Error" });
       }
     });

     // VERIFICAR
     router.get("/verify", async (req, res) => {
        const hash = (req.query.hash as string)?.trim();
        const [lug] = await db.select().from(luggage).where(eq(luggage.certificateHash, hash));
        if (!lug) return res.status(404).json({ valid: false });
        const items = await db.select().from(manifestItems).where(eq(manifestItems.luggageId, lug.id));
        res.json({
          valid: true,
          luggageId: lug.id,
          nickname: lug.nickname,
          brand: lug.brand,
          size: lug.size,
          type: lug.type,
          color: lug.color,
          isSealed: lug.isSealed,
          isLocked: lug.isLocked,
          createdAt: lug.createdAt,
          items: items.map(i => ({
            name: i.name,
            category: i.category,
            brand: i.brand,
            quantity: i.quantity,
            value: i.value,
            serialNumber: i.serialNumber,
          }))
        });
         });

      // ELIMINAR MALETA
      router.delete("/:id", async (req, res) => {
      try {
      const { id } = req.params;
      await db.delete(manifestItems).where(eq(manifestItems.luggageId, id));
      const [deleted] = await db
      .delete(luggage)
      .where(eq(luggage.id, id))
      .returning();

      if (!deleted) {
      return res.status(404).send("Maleta no encontrada");
      }

      res.json({ success: true, id });
      } catch (error) {
      console.error("Error eliminando maleta:", error);
      res.status(500).send("Error eliminando maleta");
      }
      });

      // PATCH - Actualizar maleta (para fotos)
      router.patch("/:id", async (req, res) => {
      try {
      const { id } = req.params;
      const data = req.body;

      const [updated] = await db
      .update(luggage)
      .set(data)
      .where(eq(luggage.id, id))
      .returning();

      if (!updated) {
      return res.status(404).send("Maleta no encontrada");
      }

      res.json(updated);
      } catch (error) {
      console.error("Error actualizando maleta:", error);
      res.status(500).send("Error actualizando maleta");
      }
      });

      export default router;