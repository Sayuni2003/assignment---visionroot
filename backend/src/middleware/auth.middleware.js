import mongoose from 'mongoose';

import User from '../models/user.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import AppError from '../utils/AppError.js';
import { ACCESS_TOKEN_COOKIE } from '../utils/cookies.js';
import { verifyAccessToken } from '../utils/tokens.js';

// 401: the caller is not (or no longer) authenticated.
export async function authenticate(req, res, next) {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (typeof token !== 'string' || token.length === 0) {
    throw new AppError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, 'Invalid or expired access token');
  }

  const { sub: userId, sid: sessionId } = payload;
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(sessionId)) {
    throw new AppError(401, 'Invalid or expired access token');
  }

  // Checking the session on every request is what makes logout and rotation take effect
  // immediately, at the cost of one extra lookup per request.
  const session = await RefreshToken.findById(sessionId);
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.userId.equals(userId)
  ) {
    throw new AppError(401, 'Session is no longer valid');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(401, 'User no longer exists');
  }

  // The role comes from the database, never from the token.
  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  req.sessionId = sessionId;
  next();
}

// 403: the caller is authenticated but their role is not allowed. Must run after authenticate.
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'You do not have permission to perform this action');
    }

    next();
  };
}
