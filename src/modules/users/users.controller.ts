import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

import { getCurrentUser, updateAvatarFile, updateUser } from './users.service.js';

export const usersController = {
  async current(req: AuthenticatedRequest, res: Response) {
    const user = await getCurrentUser(req.userId);
    res.json(user);
  },

  async patchMe(req: AuthenticatedRequest, res: Response) {
    const user = await updateUser(req.userId, req.body);
    res.json(user);
  },

  async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    // Body is a Buffer because users.router.ts uses express.raw()
    const body = req.body as unknown;
    const fileBuffer = Buffer.isBuffer(body) ? body : Buffer.from('');
    const contentType = String(req.headers['content-type'] || '');
    const user = await updateAvatarFile(req.userId, { contentType, body: fileBuffer });
    res.json(user);
  },
};
