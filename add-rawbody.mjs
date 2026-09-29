import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  'app.use(express.json());',
  `app.use(express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf; }
}));`
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak13', original);
fs.writeFileSync(path, content);
console.log('✅ rawBody capturado. Backup en ' + path + '.bak13');
