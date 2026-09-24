import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

import { config } from '../config/env.js';

// Single source for both lifetimes: used for the token/session expiry and the cookie maxAge.
export const ACCESS_TOKEN_TTL_MS = config.jwt.accessTokenExpiresMinutes * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = config.refreshToken.expiresDays * 24 * 60 * 60 * 1000;

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
  return jwt.sign({ sub: String(user.id), sid: String(sessionId) }, config.jwt.accessSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.accessTokenExpiresMinutes * 60, // seconds
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] });
}
