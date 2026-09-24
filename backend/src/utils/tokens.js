import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const DAY_MS = 24 * 60 * 60 * 1000;

// Refresh tokens are opaque random strings; only their hash is ever stored.
export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

// SHA-256 (not bcrypt) is enough here: the token has 320 bits of randomness, so there is nothing
// to brute-force, and a deterministic hash lets us look the session up by it.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// The role is deliberately left out: authenticate() reads it from the database on every request,
// so a role change takes effect immediately instead of when the token expires.
export function signAccessToken(user, sessionId) {
  return jwt.sign({ sub: String(user.id), sid: String(sessionId) }, process.env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
}

// Shared by the session expiry (expiresAt) and the refresh cookie's maxAge so they stay in step.
export function getRefreshTokenTtlMs() {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error('REFRESH_TOKEN_EXPIRES_DAYS must be a positive number.');
  }

  return days * DAY_MS;
}
