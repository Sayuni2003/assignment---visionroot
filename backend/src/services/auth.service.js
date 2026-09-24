import bcrypt from 'bcrypt';

import User from '../models/user.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import AppError from '../utils/AppError.js';
import {
  REFRESH_TOKEN_TTL_MS,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '../utils/tokens.js';

const BCRYPT_COST = 12;
const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_REFRESH_TOKEN = 'Invalid or expired refresh token';

let dummyPasswordHash;

// Compared against when the email is unknown, so a missing user takes about as long to reject
// as a wrong password and response times do not reveal which emails are registered.
function getDummyPasswordHash() {
  dummyPasswordHash ??= bcrypt.hash('timing-equaliser-not-a-real-password', BCRYPT_COST);
  return dummyPasswordHash;
}

function normaliseEmail(email) {
  return email.trim().toLowerCase();
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function registerUser({ name, email, password }) {
  const normalisedEmail = normaliseEmail(email);
  const duplicateEmail = () =>
    new AppError(409, 'Email is already registered', { email: 'Email is already registered' });

  if (await User.exists({ email: normalisedEmail })) {
    throw duplicateEmail();
  }

  const passwordHash = await hashPassword(password);

  try {
    // The role is never taken from the request: public registration always creates a USER.
    return await User.create({ name, email: normalisedEmail, passwordHash, role: 'USER' });
  } catch (error) {
    // Two simultaneous registrations can both pass the exists() check; the unique index catches it.
    if (error?.code === 11000) {
      throw duplicateEmail();
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: normaliseEmail(email) }).select('+passwordHash');
  const passwordMatches = await bcrypt.compare(
    password,
    user ? user.passwordHash : await getDummyPasswordHash(),
  );

  // Same message for an unknown email and a wrong password, so accounts cannot be enumerated.
  if (!user || !passwordMatches) {
    throw new AppError(401, INVALID_CREDENTIALS);
  }

  return createSession(user);
}

export async function createSession(user) {
  const refreshToken = generateRefreshToken();

  const session = await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  const accessToken = signAccessToken(user, session._id);

  return { user, accessToken, refreshToken };
}

export async function refreshSession(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    throw new AppError(401, 'Refresh token required');
  }

  const session = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError(401, INVALID_REFRESH_TOKEN);
  }

  const user = await User.findById(session.userId);

  if (!user) {
    throw new AppError(401, INVALID_REFRESH_TOKEN);
  }

  // Rotate: revoke the old session only if it is still active. If two requests refresh with the
  // same token at once, only one update matches; the other request gets a 401.
  const { matchedCount } = await RefreshToken.updateOne(
    { _id: session._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  if (matchedCount === 0) {
    throw new AppError(401, INVALID_REFRESH_TOKEN);
  }

  return createSession(user);
}

// Revokes the session behind this refresh token. Missing, unknown or already revoked tokens are
// ignored so logout always succeeds.
export async function logoutSession(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    return;
  }

  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}
