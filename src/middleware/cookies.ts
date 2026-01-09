import type { NextFunction, Request, Response } from 'express';

export function cookiesMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.cookie;
    const cookies: Record<string, string> = {};

    if (header) {
      for (const part of header.split(';')) {
        const [rawKey, ...rest] = part.split('=');
        const key = rawKey?.trim();
        if (!key) continue;
        const rawValue = rest.join('=').trim();
        if (!rawValue) {
          cookies[key] = '';
        } else {
          try {
            cookies[key] = decodeURIComponent(rawValue);
          } catch {
            // If malformed percent-encoding is provided, do not crash the request.
            // Fall back to the raw value.
            cookies[key] = rawValue;
          }
        }
      }
    }

    req.cookies = cookies;
    next();
  };
}
