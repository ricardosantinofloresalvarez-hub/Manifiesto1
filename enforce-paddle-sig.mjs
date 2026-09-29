import fs from 'fs';

const path = 'server/paddleRoutes.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

const oldBlock = `    const isValid = verifyPaddleSignature(req);
    console.log(\`[Paddle webhook] Firma \${isValid ? "VÁLIDA ✅" : "INVÁLIDA ❌"} (modo observación, no bloquea)\`);
    const event = req.body;`;

const newBlock = `    const isValid = verifyPaddleSignature(req);
    if (!isValid) {
      console.warn("[Paddle webhook] Firma INVÁLIDA ❌ — petición rechazada");
      return res.status(401).json({ error: "Firma inválida" });
    }
    const event = req.body;`;

if (!content.includes(oldBlock)) {
  console.error('⚠️  No se encontró el bloque exacto.');
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(path + '.bak2', original);
fs.writeFileSync(path, content);
console.log('✅ Firma de Paddle ahora se exige (modo bloqueo real). Backup en ' + path + '.bak2');
