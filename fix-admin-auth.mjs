import fs from 'fs';

const path = 'server/adminRoutes.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

// 1. importar requireAuth
content = content.replace(
  'const router = Router();',
  'import { requireAuth } from "./authMiddleware";\n\nconst router = Router();\nrouter.use(requireAuth);'
);

// 2. reemplazar TODAS las ocurrencias de leer el userId desde query por leerlo de la sesión
content = content.split('const userId = req.query.userId as string;').join('const userId = (req.user as any)?.id;');

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak', original);
fs.writeFileSync(path, content);
console.log('✅ Admin routes ahora usan la sesión real. Backup en ' + path + '.bak');
