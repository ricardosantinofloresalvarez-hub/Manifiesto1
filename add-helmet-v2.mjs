import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  "app.set('trust proxy', 1);",
  `app.set('trust proxy', 1);\n\napp.use(helmet({\n  contentSecurityPolicy: false,\n  referrerPolicy: { policy: 'no-referrer-when-downgrade' },\n}));`
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak4', original);
fs.writeFileSync(path, content);
console.log('✅ Helmet aplicado con referrerPolicy ajustado. Backup en ' + path + '.bak4');
