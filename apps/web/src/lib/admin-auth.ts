import 'server-only';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { prisma } from './prisma';
const scrypt = promisify(crypto.scrypt);
export const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
export async function password(value: string) {
  const salt = crypto.randomBytes(16).toString('hex'),
    key = (await scrypt(value, salt, 64)) as Buffer;
  return salt + ':' + key.toString('hex');
}
export async function verify(value: string, stored: string) {
  try {
    const [salt, key] = stored.split(':');
    const derived = (await scrypt(value, salt, 64)) as Buffer;
    return crypto.timingSafeEqual(derived, Buffer.from(key, 'hex'));
  } catch {
    return false;
  }
}
export function sessionToken(request: Request) {
  return (
    request.headers
      .get('cookie')
      ?.split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('ucp_admin='))
      ?.slice(10) || ''
  );
}
export async function currentUser(request: Request) {
  const token = sessionToken(request);
  if (!token) return null;
  const session = await prisma.admin_sessions.findFirst({
    where: { id_hash: hash(token), expires_at: { gt: new Date() }, admin_users: { active: true } },
    include: { admin_users: true },
  });
  return session?.admin_users || null;
}
export function sessionCookie(token: string) {
  return (
    'ucp_admin=' +
    token +
    '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' +
    (token ? '28800' : '0') +
    (process.env.NODE_ENV === 'production' ? '; Secure' : '')
  );
}
export async function createSession(userId: bigint) {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.admin_sessions.create({
    data: { id_hash: hash(token), user_id: userId, expires_at: new Date(Date.now() + 8 * 3600000) },
  });
  return token;
}
export function publicUser(user: Awaited<ReturnType<typeof currentUser>>) {
  return user ? { id: Number(user.id), name: user.name, email: user.email, role: user.role } : null;
}
type RateState = { n: number; until: number };
const rateLimitKey = (key: string) => 'login_rl:' + key;
export async function rateLimit(key: string, max = 15) {
  const settingKey = rateLimitKey(key);
  const now = Date.now();
  const existing = await prisma.site_settings.findUnique({ where: { setting_key: settingKey } });
  const previous = existing?.draft_value as RateState | undefined;
  const next: RateState =
    previous && previous.until > now
      ? { n: previous.n + 1, until: previous.until }
      : { n: 1, until: now + 600000 };
  await prisma.site_settings.upsert({
    where: { setting_key: settingKey },
    create: { setting_key: settingKey, draft_value: next },
    update: { draft_value: next },
  });
  return next.n <= max;
}
export async function clearAttempts(key: string) {
  await prisma.site_settings.deleteMany({ where: { setting_key: rateLimitKey(key) } });
}
