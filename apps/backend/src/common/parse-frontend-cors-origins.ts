const DEFAULT_ORIGIN = 'http://localhost:5173';

/**
 * Reads FRONTEND_URL (comma-separated allowed) for CORS / Socket.IO.
 * Example: FRONTEND_URL=http://localhost:5173,https://app.example.com
 */
export function parseFrontendCorsOrigins(): string | string[] {
  const raw = process.env.FRONTEND_URL;
  if (!raw?.trim()) return DEFAULT_ORIGIN;
  const origins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (origins.length === 0) return DEFAULT_ORIGIN;
  return origins.length === 1 ? origins[0]! : origins;
}
