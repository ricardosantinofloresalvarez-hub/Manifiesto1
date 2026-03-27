import { Resend } from 'resend';
import { db } from './db';
import { magicLinkTokens, users } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.BASE_URL || 'https://159cf49c-0920-4684-b3d1-58a353686a03-00-32y8k86zgc8mg.worf.replit.dev';

export async function sendMagicLink(email: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  await db.insert(magicLinkTokens).values({ email, token, expiresAt });

  const magicUrl = `${BASE_URL}/api/auth/magic?token=${token}`;

  await resend.emails.send({
    from: 'Manifiesto <onboarding@resend.dev>',
    to: email,
    subject: 'Tu enlace de acceso a Manifiesto',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Manifiesto ✈️</h1>
        <p style="color: #666; margin-bottom: 24px;">Haz clic en el botón para iniciar sesión. El enlace expira en 15 minutos.</p>
        <a href="${magicUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Iniciar sesión
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">Si no solicitaste este enlace, ignora este correo.</p>
      </div>
    `
  });
}

export async function verifyMagicToken(token: string) {
  const [record] = await db.select()
    .from(magicLinkTokens)
    .where(and(
      eq(magicLinkTokens.token, token),
      eq(magicLinkTokens.used, false),
      gt(magicLinkTokens.expiresAt, new Date())
    ));

  if (!record) return null;

  await db.update(magicLinkTokens)
    .set({ used: true })
    .where(eq(magicLinkTokens.id, record.id));

  const [user] = await db.select().from(users).where(eq(users.email, record.email));
  return user || null;
}