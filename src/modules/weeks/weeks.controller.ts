import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

import { HttpError } from '../../middleware/errorHandler.js';

import { getCurrentWeekInfo, getWeekBabyState, getWeekDashboardInfoPublic, getWeekMomState } from './weeks.service.js';

export const weeksController = {
  // Public: week dashboard info by weekNumber
  async getByWeekNumber(req: Request<{ weekNumber: string }>, res: Response) {
    const weekNumber = Number(req.params.weekNumber);
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 40) {
      throw new HttpError(400, 'Invalid weekNumber', { code: 'INVALID_WEEK_NUMBER' });
    }
    const dueDate = typeof req.query.dueDate === 'string' ? req.query.dueDate : undefined;
    const info = await getWeekDashboardInfoPublic(weekNumber, dueDate);
    res.status(200).json(info);
  },

  // Private: current week dashboard info based on user's dueDate
  async getCurrent(req: AuthenticatedRequest, res: Response) {
    const info = await getCurrentWeekInfo(req.userId);
    res.status(200).json(info);
  },

  // Private: baby development by week
  async getBabyByWeekNumber(req: AuthenticatedRequest, res: Response) {
    const weekNumber = Number((req as unknown as Request<{ weekNumber: string }>).params.weekNumber);
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 40) {
      throw new HttpError(400, 'Invalid weekNumber', { code: 'INVALID_WEEK_NUMBER' });
    }
    const row = await getWeekBabyState(weekNumber);
    res.status(200).json(row);
  },

  // Private: mom body changes by week
  async getMomByWeekNumber(req: AuthenticatedRequest, res: Response) {
    const weekNumber = Number((req as unknown as Request<{ weekNumber: string }>).params.weekNumber);
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 40) {
      throw new HttpError(400, 'Invalid weekNumber', { code: 'INVALID_WEEK_NUMBER' });
    }
    const row = await getWeekMomState(weekNumber);
    res.status(200).json(row);
  },
};
