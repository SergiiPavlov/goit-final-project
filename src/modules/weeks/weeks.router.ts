import { Router, type NextFunction, type RequestHandler } from 'express';

import { weeksController } from './weeks.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { weekNumberParamSchema } from './weeks.schemas.js';

const router = Router();

const validateWeekNumberParam: RequestHandler<{ weekNumber: string }> = (
  req,
  _res,
  next: NextFunction,
) => {
  const parsed = weekNumberParamSchema.safeParse({ weekNumber: req.params.weekNumber });

  if (!parsed.success) {
    return next(
      new HttpError(400, 'Validation error', {
        code: 'VALIDATION_ERROR',
        details: parsed.error.format(),
      }),
    );
  }

  return next();
};

// PRIVATE
router.get('/current', requireAuth, weeksController.getCurrent);
router.get('/:weekNumber/baby', requireAuth, validateWeekNumberParam, weeksController.getBabyByWeekNumber);
router.get('/:weekNumber/mom', requireAuth, validateWeekNumberParam, weeksController.getMomByWeekNumber);

// PUBLIC
router.get('/:weekNumber', validateWeekNumberParam, weeksController.getByWeekNumber);

export default router;
