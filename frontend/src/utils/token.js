/**
 * Decode a JWT payload without verifying the signature.
 * Returns null if the token is malformed.
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT is expired (or will expire within `bufferMs`).
 * Returns true if expired/invalid, false if still valid.
 */
export function isTokenExpired(token, bufferMs = 0) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - bufferMs;
}

/**
 * Returns milliseconds until the token expires.
 * Returns 0 if the token is already expired or invalid.
 */
export function getTokenRemainingMs(token) {
  const payload = decodeToken(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
}
