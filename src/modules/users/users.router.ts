import { Router, raw } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { usersController } from './users.controller.js';
import { updateUserSchema } from './users.schemas.js';
import { validateBody } from '../../middleware/validate.js';

export const usersRouter = Router();

// Current user profile
usersRouter.get('/current', requireAuth, asyncHandler(usersController.current));

// Update profile fields
usersRouter.patch('/', requireAuth, validateBody(updateUserSchema), asyncHandler(usersController.patchMe));

// Update avatar via multipart/form-data (file picker).
// Field name: avatar
usersRouter.patch(
  '/avatar',
  requireAuth,
  raw({ type: 'multipart/form-data', limit: '5mb' }),
  asyncHandler(usersController.uploadAvatar),
);
