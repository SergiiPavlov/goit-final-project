import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';

import {
  getCurrentWeekInfo,
  getWeekBabyState,
  getWeekDashboardInfoPublic,
  getWeekMomState,
} from './weeks.service.js';

function parseWeekNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 40) {
    throw new HttpError(400, 'Invalid weekNumber', { code: 'INVALID_WEEK_NUMBER' });
  }
  return n;
}

export const weeksController = {
  // Public: week dashboard info by weekNumber
  async getByWeekNumber(req: Request<{ weekNumber: string }>, res: Response) {
    const weekNumber = parseWeekNumber(req.params.weekNumber);
    const dueDate = typeof req.query.dueDate === 'string' ? req.query.dueDate : undefined;
    const info = await getWeekDashboardInfoPublic(weekNumber, dueDate);
    res.status(200).json(info);
  },

  // Private: current week dashboard info based on user's dueDate
  async getCurrent(req: Request, res: Response) {
    const { userId } = req as AuthenticatedRequest;
    const info = await getCurrentWeekInfo(userId);
    res.status(200).json(info);
  },

  // Private: baby development by week
  async getBabyByWeekNumber(req: Request<{ weekNumber: string }>, res: Response) {
    const weekNumber = parseWeekNumber(req.params.weekNumber);
    const row = await getWeekBabyState(weekNumber);
    res.status(200).json(row);
  },

  // Private: mom body changes by week
  async getMomByWeekNumber(req: Request<{ weekNumber: string }>, res: Response) {
    const weekNumber = parseWeekNumber(req.params.weekNumber);
    const row = await getWeekMomState(weekNumber);
    res.status(200).json(row);
  },
};
