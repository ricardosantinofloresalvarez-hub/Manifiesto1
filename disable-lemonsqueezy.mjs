import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  'import paymentsRoutes from "./paymentsRoutes";',
  '// import paymentsRoutes from "./paymentsRoutes"; // deshabilitado 27 sept: Lemon Squeezy ya no se usa, webhook sin auth obligatoria era vulnerable'
);

content = content.replace(
  'app.use("/api/payments", paymentsRoutes);',
  '// app.use("/api/payments", paymentsRoutes); // deshabilitado 27 sept: ver nota arriba'
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak9', original);
fs.writeFileSync(path, content);
console.log('✅ Rutas de Lemon Squeezy deshabilitadas. Backup en ' + path + '.bak9');
