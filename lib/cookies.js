// ============================================================================
// lib/cookies.js — minimal parse/build helpers for a single auth cookie.
// ============================================================================

export function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return null;
}

/** Build a Set-Cookie header value. Pass maxAgeSeconds: 0 to clear the cookie. */
export function buildSetCookie(name, value, maxAgeSeconds) {
  const attrs = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax"];
  if (maxAgeSeconds === 0) attrs.push("Max-Age=0");
  else if (maxAgeSeconds) attrs.push(`Max-Age=${maxAgeSeconds}`);
  return attrs.join("; ");
}
