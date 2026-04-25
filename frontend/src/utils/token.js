// Decode JWT token tanpa memverifikasi signature
// Mengembalikan null jika token tidak valid
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

// Cek apakah JWT sudah expired atau akan expired dalam bufferMs
// Mengembalikan true jika token sudah expired atau akan expired dalam bufferMs
export function isTokenExpired(token, bufferMs = 0) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - bufferMs;
}

// Ambil sisa waktu token dalam milisecond
// Mengembalikan 0 jika token sudah expired atau tidak valid
export function getTokenRemainingMs(token) {
  const payload = decodeToken(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
}
