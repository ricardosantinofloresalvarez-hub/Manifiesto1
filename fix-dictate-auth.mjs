import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

// 1. importar requireAuth (junto a los otros imports locales)
content = content.replace(
  'import adminRoutes from "./adminRoutes";',
  'import adminRoutes from "./adminRoutes";\nimport { requireAuth } from "./authMiddleware";'
);

// 2. aplicar requireAuth a la ruta /api/dictate
content = content.replace(
  'app.post("/api/dictate", async (req, res) => {',
  'app.post("/api/dictate", requireAuth, async (req, res) => {'
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar — revisa el archivo manualmente.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak8', original);
fs.writeFileSync(path, content);
console.log('✅ requireAuth agregado a /api/dictate. Backup en ' + path + '.bak8');
