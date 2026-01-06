import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { diariesController } from './diaries.controller.js';
import { createDiarySchema, updateDiarySchema } from './diaries.schemas.js';

export const diariesRouter = Router();

// Create diary entry
diariesRouter.post('/', requireAuth, validateBody(createDiarySchema), asyncHandler(diariesController.create));

// Get diary entries by date=YYYY-MM-DD (defaults to today if not provided)
diariesRouter.get('/', requireAuth, asyncHandler(diariesController.list));

// Edit diary entry
diariesRouter.patch('/:id', requireAuth, validateBody(updateDiarySchema), asyncHandler(diariesController.patch));

// Delete diary entry
diariesRouter.delete('/:id', requireAuth, asyncHandler(diariesController.remove));
