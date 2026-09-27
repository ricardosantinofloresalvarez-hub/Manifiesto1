import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  "app.set('trust proxy', 1);",
  `app.set('trust proxy', 1);\n\napp.use(helmet({ contentSecurityPolicy: false }));`
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak2', original);
fs.writeFileSync(path, content);
console.log('✅ Helmet activado (sin CSP todavía). Backup en ' + path + '.bak2');
