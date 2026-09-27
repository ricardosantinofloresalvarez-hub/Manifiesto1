import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

const oldBlock = `app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
}));`;

const newBlock = `app.use(helmet({
  contentSecurityPolicy: {
    reportOnly: true,
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://api.cloudinary.com", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://images.unsplash.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com", "https://nominatim.openstreetmap.org", "https://overpass-api.de", "https://www.google-analytics.com", "https://*.paddle.com"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://cdn.paddle.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", "https://*.paddle.com", "https://accounts.google.com"],
    },
  },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
}));`;

content = content.replace(oldBlock, newBlock);

if (content === original) {
  console.error('⚠️  No se encontró el bloque exacto de Helmet a reemplazar — revisa el archivo manualmente.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak5', original);
fs.writeFileSync(path, content);
console.log('✅ CSP en modo Report-Only agregado. Backup en ' + path + '.bak5');
