import fs from 'fs';

const path = 'server/paddleRoutes.ts';

let content = fs.readFileSync(path, 'utf8');
const original = content;

content = content.replace(
  'import { Router } from "express";',
  'import { Router } from "express";\nimport crypto from "crypto";'
);

content = content.replace(
  'router.post("/webhook", async (req, res) => {\n  try {\n    const event = req.body;',
  `function verifyPaddleSignature(req: any): boolean {
  try {
    const sigHeader = req.headers["paddle-signature"] as string;
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!sigHeader || !secret || !req.rawBody) return false;
    const parts = Object.fromEntries(sigHeader.split(";").map((p: string) => p.split("=")));
    const { ts, h1 } = parts;
    if (!ts || !h1) return false;
    const signedPayload = \`\${ts}:\${req.rawBody.toString()}\`;
    const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
  } catch {
    return false;
  }
}

router.post("/webhook", async (req, res) => {
  try {
    const isValid = verifyPaddleSignature(req);
    console.log(\`[Paddle webhook] Firma \${isValid ? "VÁLIDA ✅" : "INVÁLIDA ❌"} (modo observación, no bloquea)\`);
    const event = req.body;`
);

if (content === original) {
  console.error('⚠️  No se encontró texto para reemplazar.');
  process.exit(1);
}

fs.writeFileSync(path + '.bak', original);
fs.writeFileSync(path, content);
console.log('✅ Verificación de firma agregada en modo observación. Backup en ' + path + '.bak');
