import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

const replacements = [
  ['imgSrc: ["\'self\'", "data:", "https://api.cloudinary.com", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://images.unsplash.com"],',
   'imgSrc: ["\'self\'", "data:", "https://api.cloudinary.com", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://images.unsplash.com"],\n      fontSrc: ["\'self\'", "https://fonts.gstatic.com"],'],
  ['connectSrc: ["\'self\'", "https://api.cloudinary.com", "https://nominatim.openstreetmap.org", "https://overpass-api.de", "https://www.google-analytics.com", "https://*.paddle.com"],',
   'connectSrc: ["\'self\'", "https://api.cloudinary.com", "https://nominatim.openstreetmap.org", "https://overpass-api.de", "https://www.google-analytics.com", "https://*.paddle.com", "https://api.openweathermap.org"],'],
  ['scriptSrc: ["\'self\'", "https://www.googletagmanager.com", "https://cdn.paddle.com"],',
   'scriptSrc: ["\'self\'", "\'unsafe-inline\'", "https://www.googletagmanager.com", "https://cdn.paddle.com", "https://public.profitwell.com"],'],
  ['styleSrc: ["\'self\'", "\'unsafe-inline\'"],',
   'styleSrc: ["\'self\'", "\'unsafe-inline\'", "https://fonts.googleapis.com", "https://cdn.paddle.com"],'],
];

for (const [oldStr, newStr] of replacements) {
  if (!content.includes(oldStr)) {
    console.error('⚠️  No se encontró: ' + oldStr.slice(0, 60) + '...');
    process.exit(1);
  }
  content = content.replace(oldStr, newStr);
}

fs.writeFileSync(path + '.bak6', original);
fs.writeFileSync(path, content);
console.log('✅ CSP actualizado con los dominios nuevos. Backup en ' + path + '.bak6');
