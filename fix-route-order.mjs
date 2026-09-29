import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

const oldBlock = `app.use("/api", itineraryRoutes);
// app.use("/api/payments", paymentsRoutes); // deshabilitado 27 sept: ver nota arriba
app.use("/api/admin", adminRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/paddle", paddleRoutes);`;

const newBlock = `// app.use("/api/payments", paymentsRoutes); // deshabilitado 27 sept: ver nota arriba
app.use("/api/admin", adminRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/paddle", paddleRoutes);
app.use("/api", itineraryRoutes); // movido al final: su requireAuth interceptaba /api/paddle y /api/paypal antes de que llegaran esos webhooks`;

if (!content.includes(oldBlock)) {
  console.error('⚠️  No se encontró el bloque exacto — revisa el orden manualmente.');
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(path + '.bak14', original);
fs.writeFileSync(path, content);
console.log('✅ Orden de rutas corregido. Backup en ' + path + '.bak14');
