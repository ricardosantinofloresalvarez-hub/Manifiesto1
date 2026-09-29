import fs from 'fs';

const path = 'server/authMiddleware.ts';

const original = fs.readFileSync(path, 'utf8');

const newContent = `import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  console.warn(\`[SECURITY] Acceso no autorizado: \${req.method} \${req.path} IP:\${req.ip}\`);
  return res.status(401).json({ error: "No autorizado" });
}

export function getUserId(req: Request): string | null {
  if (req.user) return (req.user as any).id;
  return null;
}
`;

fs.writeFileSync(path + '.bak2', original);
fs.writeFileSync(path, newContent);
console.log('✅ Puerta trasera de requireAuth eliminada. Backup en ' + path + '.bak2');
