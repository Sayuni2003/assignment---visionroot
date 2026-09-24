import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

import User from '../models/user.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import AppError from '../utils/AppError.js';
import {
  generateRefreshToken,
  getRefreshTokenTtlMs,
  hashToken,
  signAccessToken,
} from '../utils/tokens.js';

const BCRYPT_COST = 12;
const INVALID_CREDENTIALS = 'Invalid email or password';
const SESSION_INVALID = 'Session is no longer valid';

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

function revokeAllUserSessions(userId) {
  return RefreshToken.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

// A refresh token that was already rotated or revoked is being presented again, so it has most
// likely been stolen. Every active session of the user is revoked to lock the attacker out.
async function handleTokenReuse(session) {
  const { modifiedCount } = await revokeAllUserSessions(session.userId);
  console.warn(
    `Refresh token reuse detected for user ${session.userId} (session ${session._id}); ` +
      `revoked ${modifiedCount} active session(s).`,
  );
  throw new AppError(401, SESSION_INVALID);
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

export async function createSession(user, sessionId = new mongoose.Types.ObjectId()) {
  const refreshToken = generateRefreshToken();

  const session = await RefreshToken.create({
    _id: sessionId,
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + getRefreshTokenTtlMs()),
  });

  const accessToken = signAccessToken(user, session._id);

  return { user, accessToken, refreshToken };
}

export async function refreshSession(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    throw new AppError(401, 'Refresh token required');
  }

  const session = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });

  if (!session) {
    throw new AppError(401, 'Invalid refresh token');
  }

  if (session.revokedAt) {
    await handleTokenReuse(session);
  }

  if (session.expiresAt <= new Date()) {
    throw new AppError(401, 'Refresh token expired');
  }

  const user = await User.findById(session.userId);

  if (!user) {
    await RefreshToken.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    throw new AppError(401, SESSION_INVALID);
  }

  // Revoke the old session with a conditional update before issuing the new one. If two requests
  // rotate the same token at once, only one can win; the other is handled as reuse. The next
  // session's id is generated up front so replacedBy can be set in the same update.
  const nextSessionId = new mongoose.Types.ObjectId();
  const rotated = await RefreshToken.findOneAndUpdate(
    { _id: session._id, revokedAt: null },
    { $set: { revokedAt: new Date(), replacedBy: nextSessionId } },
  );

  if (!rotated) {
    await handleTokenReuse(session);
  }

  return createSession(user, nextSessionId);
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
