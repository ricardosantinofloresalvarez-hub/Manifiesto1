import fs from 'fs';

const path = 'server/index.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

// 1. imports
content = content.replace(
  'import session from "express-session";',
  'import session from "express-session";\nimport connectPgSimple from "connect-pg-simple";\n\nconst PgSession = connectPgSimple(session);'
);

// 2. agregar el store a la config de session
content = content.replace(
  `app.use(session({
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));`,
  `app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));`
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak11', original);
fs.writeFileSync(path, content);
console.log('✅ Sesión persistente en Postgres configurada. Backup en ' + path + '.bak11');
