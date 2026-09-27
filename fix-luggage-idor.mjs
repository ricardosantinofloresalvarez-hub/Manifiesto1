import fs from 'fs';

const path = 'server/luggageRoutes.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

const oldBlock = `  const { tripId, userId } = req.query;
  if (!tripId) return res.status(400).json({ error: "tripId requerido" });
  // Verificar que el trip pertenece al usuario
  if (userId) {
    const [trip] = await db.select().from(trips).where(eq(trips.id, String(tripId)));
    if (!trip || trip.userId !== String(userId)) return res.status(403).json({ error: "No autorizado" });
  }`;

const newBlock = `  const { tripId } = req.query;
  if (!tripId) return res.status(400).json({ error: "tripId requerido" });
  // Verificar que el trip pertenece al usuario autenticado (sesión real, no query param)
  const sessionUserId = (req.user as any)?.id;
  const [trip] = await db.select().from(trips).where(eq(trips.id, String(tripId)));
  if (!trip || trip.userId !== sessionUserId) return res.status(403).json({ error: "No autorizado" });`;

if (!content.includes(oldBlock)) {
  console.error('⚠️  No se encontró el bloque exacto — revisa el archivo manualmente.');
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(path + '.bak', original);
fs.writeFileSync(path, content);
console.log('✅ Verificación de dueño obligatoria y basada en sesión real. Backup en ' + path + '.bak');
