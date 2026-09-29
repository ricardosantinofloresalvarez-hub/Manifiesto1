import fs from 'fs';

const path = 'server/tripRoutes.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

const fixes = [
  // 1. GET / — usar sesión, no query
  [
`router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).send("userId is required");

    const results = await db.select().from(trips).where(eq(trips.userId, String(userId)));`,
`router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).send("No autenticado");

    const results = await db.select().from(trips).where(eq(trips.userId, String(userId)));`
  ],
  // 2. GET /:id — sesión, no query, sin fallback inseguro
  [
`    const { id } = req.params;
    const userId = req.query.userId || (req.user as any)?.id;
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));

    if (!trip) return res.status(404).send("Trip not found");
    if (userId && trip.userId !== String(userId)) return res.status(403).json({ error: "No autorizado" });`,
`    const { id } = req.params;
    const userId = (req.user as any)?.id;
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));

    if (!trip) return res.status(404).send("Trip not found");
    if (trip.userId !== userId) return res.status(403).json({ error: "No autorizado" });`
  ],
  // 3. POST / — forzar userId desde sesión, ignorar el del body
  [
    `const [newTrip] = await db.insert(trips).values({ ...req.body, imageUrl }).returning();`,
    `const [newTrip] = await db.insert(trips).values({ ...req.body, userId: (req.user as any)?.id, imageUrl }).returning();`
  ],
  // 4. PATCH /:id — agregar requireAuth + verificación de dueño
  [
`router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = insertTripSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    }
    const [updated] = await db.update(trips).set(req.body).where(eq(trips.id, id)).returning();

    if (!updated) return res.status(404).send("Trip not found");`,
`router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    const [existing] = await db.select().from(trips).where(eq(trips.id, id));
    if (!existing) return res.status(404).send("Trip not found");
    if (existing.userId !== userId) return res.status(403).json({ error: "No autorizado" });
    const parsed = insertTripSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    }
    const { userId: _ignore, ...safeBody } = req.body;
    const [updated] = await db.update(trips).set(safeBody).where(eq(trips.id, id)).returning();

    if (!updated) return res.status(404).send("Trip not found");`
  ],
  // 5. DELETE /:id — agregar verificación de dueño
  [
`router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db.delete(trips).where(eq(trips.id, id)).returning();

    if (!deleted) return res.status(404).send("Trip not found");`,
`router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    const [existing] = await db.select().from(trips).where(eq(trips.id, id));
    if (!existing) return res.status(404).send("Trip not found");
    if (existing.userId !== userId) return res.status(403).json({ error: "No autorizado" });
    const [deleted] = await db.delete(trips).where(eq(trips.id, id)).returning();

    if (!deleted) return res.status(404).send("Trip not found");`
  ],
];

for (const [oldStr, newStr] of fixes) {
  if (!content.includes(oldStr)) {
    console.error('⚠️  No se encontró un bloque:\n' + oldStr.slice(0, 80) + '...');
    process.exit(1);
  }
  content = content.replace(oldStr, newStr);
}

fs.writeFileSync(path + '.bak', original);
fs.writeFileSync(path, content);
console.log('✅ tripRoutes.ts corregido (5 fixes). Backup en ' + path + '.bak');
