import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  'reportOnly: true,',
  'reportOnly: false,'
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak7', original);
fs.writeFileSync(path, content);
console.log('✅ CSP activado en modo bloqueo real. Backup en ' + path + '.bak7');
