import { Router } from 'express';

import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

import * as controller from './auth.controller.js';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
authRouter.post('/refresh', validateBody(refreshSchema), asyncHandler(controller.refresh));
authRouter.post('/logout', requireAuth, validateBody(logoutSchema), asyncHandler(controller.logout));
