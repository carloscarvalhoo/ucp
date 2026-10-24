const crypto = require('crypto'),
  { promisify } = require('util'),
  pool = require('./db.cjs');
const scrypt = promisify(crypto.scrypt),
  hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
async function password(value) {
  const salt = crypto.randomBytes(16).toString('hex'),
    key = await scrypt(value, salt, 64);
  return salt + ':' + key.toString('hex');
}
async function verify(value, stored) {
  try {
    const [salt, key] = stored.split(':'),
      derived = await scrypt(value, salt, 64);
    return crypto.timingSafeEqual(derived, Buffer.from(key, 'hex'));
  } catch {
    return false;
  }
}
async function user(req) {
  const cookie = (req.headers.cookie || '')
    .split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('ucp_admin='));
  if (!cookie) return null;
  const [rows] = await pool.execute(
    'SELECT u.id,u.name,u.email,u.role FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.id_hash=? AND s.expires_at>NOW() AND u.active=1',
    [hash(cookie.slice(10))],
  );
  return rows[0] || null;
}
async function session(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await pool.execute(
    'INSERT INTO admin_sessions(id_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 8 HOUR))',
    [hash(token), userId],
  );
  res.setHeader(
    'Set-Cookie',
    'ucp_admin=' +
      token +
      '; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800' +
      (process.env.NODE_ENV === 'production' ? '; Secure' : ''),
  );
}
module.exports = { password, verify, user, session, hash };
