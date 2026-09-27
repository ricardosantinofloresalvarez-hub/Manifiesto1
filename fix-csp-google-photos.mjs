import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  'imgSrc: ["\'self\'", "data:", "https://api.cloudinary.com", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://images.unsplash.com"],',
  'imgSrc: ["\'self\'", "data:", "https://api.cloudinary.com", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://images.unsplash.com", "https://*.googleusercontent.com"],'
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak10', original);
fs.writeFileSync(path, content);
console.log('✅ googleusercontent.com agregado a imgSrc. Backup en ' + path + '.bak10');
