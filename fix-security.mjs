import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

// 1. trust proxy
content = content.replace(
  'const app = express();',
  `const app = express();\n\napp.set('trust proxy', 1);`
);

// 2. función escapeHtml (justo después del import de crypto)
content = content.replace(
  'import crypto from "crypto";',
  `import crypto from "crypto";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}`
);

// 3. usar escapeHtml en el mensaje del correo
content = content.replace(
  '${message ? `<p><strong>Mensaje:</strong> ${message}</p>` : ""}',
  '${message ? `<p><strong>Mensaje:</strong> ${escapeHtml(message)}</p>` : ""}'
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar — revisa que el contenido coincida.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak', original);
fs.writeFileSync(path, content);
console.log('✅ Cambios aplicados. Backup guardado en ' + path + '.bak');
