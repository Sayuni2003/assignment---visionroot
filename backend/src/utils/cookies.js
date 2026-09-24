import { config } from '../config/env.js';
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS } from './tokens.js';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

// Both cookies are HttpOnly so page scripts (and any injected XSS) cannot read the tokens.
// sameSite "lax" works while the frontend and API are same-site (e.g. localhost:5173 -> localhost:5000;
// ports do not count). In production, serve the API on the frontend's site (e.g. a /api rewrite).
// A cross-site production deployment (frontend and API on different domains) needs
// sameSite: "none" together with secure: true, otherwise browsers will not send the cookies.
function baseCookieOptions(path) {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path,
  };
}

const accessCookieOptions = baseCookieOptions('/');
// The refresh token is only ever sent to /api/auth/* (refresh and logout), never to other endpoints.
const refreshCookieOptions = baseCookieOptions('/api/auth');

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...accessCookieOptions,
    maxAge: ACCESS_TOKEN_TTL_MS,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...refreshCookieOptions,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

// Browsers only delete a cookie when path and the other attributes match the ones it was set with.
export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, accessCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions);
}
