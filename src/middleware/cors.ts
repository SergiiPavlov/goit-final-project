import cors from 'cors';
import type { CorsOptions } from 'cors';
import { env } from '../config/env.js';

/**
 * CORS strategy:
 * - If CORS_ORIGINS is empty => allow all (dev-friendly)
 * - Otherwise => allowlist
 */
export function corsMiddleware() {
  const hasAllowlist = env.corsOrigins.length > 0;

  const options: CorsOptions = {
    origin(origin, cb) {
      if (!hasAllowlist) return cb(null, true);
      // allow non-browser tools (curl/postman) without Origin
      if (!origin) return cb(null, true);

      if (env.corsOrigins.includes(origin)) return cb(null, true);

      // IMPORTANT:
      // Do NOT throw on disallowed origins.
      // If we throw here, Express will treat it as an internal error (500), which breaks
      // same-site tooling like Swagger UI that may still send the Origin header.
      // Returning `false` simply disables CORS for this request.
      return cb(null, false);
    },
    credentials: true,
  };

  return cors(options);
}
