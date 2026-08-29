/* Gedeelde helpers voor de /api/* formulier-endpoints */

/* Voorkomt header-injectie en houdt de weergavenaam schoon:
   geen regeleindes, geen aanhalingstekens/haakjes die het "Naam <adres>"-formaat breken. */
function sanitizeHeaderValue(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/["<>]/g, "")
    .trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

/* Best-effort rate limiting per IP: het geheugen leeft alleen zolang deze
   serverless-instance warm blijft, dus dit is geen harde garantie, maar
   remt scripted misbruik in de praktijk goed af zonder extra dienst/kosten. */
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function isRateLimited(req) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "onbekend";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

module.exports = { sanitizeHeaderValue, isValidEmail, isRateLimited };
