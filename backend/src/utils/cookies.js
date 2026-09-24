import { getRefreshTokenTtlMs } from './tokens.js';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

// Keep in step with ACCESS_TOKEN_EXPIRES_IN (15m by default).
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

// Both cookies are HttpOnly so page scripts (and any injected XSS) cannot read the tokens.
// sameSite "lax" works while the frontend and API share a site (e.g. localhost:5173 -> localhost:5000).
// A cross-site production deployment (frontend and API on different domains) needs
// sameSite: "none" together with secure: true, otherwise browsers will not send the cookies.
function baseCookieOptions(path) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
  };
}

const accessCookieOptions = () => baseCookieOptions('/');
// The refresh token is only ever sent to /api/auth/* (refresh and logout), never to other endpoints.
const refreshCookieOptions = () => baseCookieOptions('/api/auth');

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...accessCookieOptions(),
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...refreshCookieOptions(),
    maxAge: getRefreshTokenTtlMs(),
  });
}

// Browsers only delete a cookie when path and the other attributes match the ones it was set with.
export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, accessCookieOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions());
}
