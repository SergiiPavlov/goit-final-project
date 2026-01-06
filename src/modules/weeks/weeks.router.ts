import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { weekNumberParamSchema } from './weeks.schemas.js';
import { weeksController } from './weeks.controller.js';

const weeksRouter = Router();

function validateWeekNumberParam(req: Request, _res: Response, next: NextFunction) {
  const result = weekNumberParamSchema.safeParse(req.params);
  if (!result.success) {
    return next(
      new HttpError(400, 'Validation error', {
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      })
    );
  }
  // mutate params to number for downstream usage
  (req.params as any).weekNumber = (result.data as any).weekNumber;
  next();
}

// Private (declare before '/:weekNumber' to avoid route shadowing)
weeksRouter.get('/current', requireAuth, asyncHandler(weeksController.getCurrent));
weeksRouter.get(
  '/:weekNumber/baby',
  requireAuth,
  validateWeekNumberParam,
  asyncHandler(weeksController.getBabyByWeekNumber as any)
);
weeksRouter.get(
  '/:weekNumber/mom',
  requireAuth,
  validateWeekNumberParam,
  asyncHandler(weeksController.getMomByWeekNumber as any)
);

// Public
weeksRouter.get('/:weekNumber', validateWeekNumberParam, asyncHandler(weeksController.getByWeekNumber));

export { weeksRouter };
