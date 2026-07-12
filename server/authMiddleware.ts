import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Verificar sesion de passport
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Verificar userId en query/body como fallback (compatibilidad con magic link)
  const userId = req.query.userId || req.body?.userId;
  if (userId) {
    return next();
  }

  console.warn();
  console.warn(`[SECURITY] Acceso no autorizado: ${req.method} ${req.path} IP:${req.ip}`);
  return res.status(401).json({ error: "No autorizado" });
}

export function getUserId(req: Request): string | null {
  if (req.user) return (req.user as any).id;
  return (req.query.userId || req.body?.userId) as string | null;
}