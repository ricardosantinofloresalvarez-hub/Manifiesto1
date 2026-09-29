import fs from 'fs';

const path = 'server/authRoutes.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

const oldBlock = `    const user = await verifyMagicToken(token);
    if (!user) return res.redirect("/login?error=expired");
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl
    }));
    res.redirect(\`\${process.env.BASE_URL || 'https://159cf49c-0920-4684-b3d1-58a353686a03-00-32y8k86zgc8mg.worf.replit.dev'}/auth/callback?user=\${userData}\`);`;

const newBlock = `    const user = await verifyMagicToken(token);
    if (!user) return res.redirect("/login?error=expired");
    req.login(user, (err) => {
      if (err) {
        console.error("Error creando sesión de magic link:", err);
        return res.redirect("/login?error=session");
      }
      const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl
      }));
      res.redirect(\`\${process.env.BASE_URL || 'https://159cf49c-0920-4684-b3d1-58a353686a03-00-32y8k86zgc8mg.worf.replit.dev'}/auth/callback?user=\${userData}\`);
    });`;

if (!content.includes(oldBlock)) {
  console.error('⚠️  No se encontró el bloque exacto.');
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(path + '.bak', original);
fs.writeFileSync(path, content);
console.log('✅ Magic link ahora crea sesión real de Passport. Backup en ' + path + '.bak');
