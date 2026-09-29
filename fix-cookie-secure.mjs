import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  'cookie: { secure: false }',
  "cookie: { secure: process.env.NODE_ENV === 'production' }"
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak12', original);
fs.writeFileSync(path, content);
console.log('✅ Cookie secure condicional a producción. Backup en ' + path + '.bak12');
