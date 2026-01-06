import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { tasksController } from './tasks.controller.js';
import { createTaskSchema, updateTaskStatusSchema } from './tasks.schemas.js';

export const tasksRouter = Router();

// Create task
tasksRouter.post('/', requireAuth, validateBody(createTaskSchema), asyncHandler(tasksController.create));

// Get tasks (by date=YYYY-MM-DD, defaults to today if not provided)
tasksRouter.get('/', requireAuth, asyncHandler(tasksController.list));

// Change task status (isDone)
tasksRouter.patch('/:id', requireAuth, validateBody(updateTaskStatusSchema), asyncHandler(tasksController.patchStatus));
