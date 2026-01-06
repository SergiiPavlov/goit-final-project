import { Router } from 'express';

import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './emotions.controller.js';

export const emotionsRouter = Router();

// Public reference list used by the diary UI.
emotionsRouter.get('/', asyncHandler(controller.list));
emotionsRouter.get('/:id', asyncHandler(controller.getById));
