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
        cookies[key] = rawValue ? decodeURIComponent(rawValue) : '';
      }
    }

    req.cookies = cookies;
    next();
  };
}
