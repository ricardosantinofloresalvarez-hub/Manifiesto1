import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  "app.use(helmet({ contentSecurityPolicy: false }));",
  `app.use(helmet({\n  contentSecurityPolicy: false,\n  referrerPolicy: { policy: 'no-referrer-when-downgrade' },\n}));`
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar — puede que ya se haya revertido helmet. Revisa el archivo manualmente.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak3', original);
fs.writeFileSync(path, content);
console.log('✅ Helmet reactivado con referrerPolicy ajustado. Backup en ' + path + '.bak3');
