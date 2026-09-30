import fs from 'fs';

const path = 'server/paypalRoutes.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  `    const user = req.user as any;
    const userId = (req.query.userId as string) || user?.id;
    if (!userId) return res.status(401).json({ error: "No autenticado" });`,
  `    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: "No autenticado" });`
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak', original);
fs.writeFileSync(path, content);
console.log('✅ paypalRoutes.ts corregido. Backup en ' + path + '.bak');
