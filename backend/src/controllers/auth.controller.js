import AppError from '../utils/AppError.js';
import { REFRESH_TOKEN_COOKIE, clearAuthCookies, setAuthCookies } from '../utils/cookies.js';
import { validateLogin, validateRegister } from '../validators/auth.validator.js';
import {
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
} from '../services/auth.service.js';

// Tokens only ever travel in HttpOnly cookies; response bodies never contain them.

export async function register(req, res) {
  const user = await registerUser(validateRegister(req.body));

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user },
  });
}

export async function login(req, res) {
  const { user, accessToken, refreshToken } = await loginUser(validateLogin(req.body));

  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { user } });
}

export async function refresh(req, res) {
  try {
    const { user, accessToken, refreshToken } = await refreshSession(
      req.cookies?.[REFRESH_TOKEN_COOKIE],
    );

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ success: true, data: { user } });
  } catch (error) {
    // A rejected refresh token is useless to the client, so drop both cookies. Unexpected errors
    // (e.g. the database being down) leave them alone so the user is not logged out for nothing.
    if (error instanceof AppError) {
      clearAuthCookies(res);
    }
    throw error;
  }
}

export async function logout(req, res) {
  try {
    await logoutSession(req.cookies?.[REFRESH_TOKEN_COOKIE]);
  } catch (error) {
    // Logout must always succeed for the client; a failed revoke is logged, and the session
    // still expires on its own.
    console.error('Failed to revoke session during logout:', error);
  }

  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out' });
}

export function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
