import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

import { HttpError } from '../../middleware/errorHandler.js';
import { parseDateYYYYMMDD } from '../../utils/time.js';
import { createTask, listTasks, updateTaskStatus } from './tasks.service.js';

function getTodayYYYYMMDD(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const tasksController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const task = await createTask(req.userId, req.body);
    res.status(201).json(task);
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const dateStrRaw = (req.query.date as string | undefined) ?? getTodayYYYYMMDD();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStrRaw)) {
      throw new HttpError(400, 'Validation error', {
        code: 'VALIDATION_ERROR',
        details: { date: ['date must be YYYY-MM-DD'] },
      });
    }

    // Validate parseable date (throws on invalid)
    try {
      parseDateYYYYMMDD(dateStrRaw);
    } catch {
      throw new HttpError(400, 'Validation error', {
        code: 'VALIDATION_ERROR',
        details: { date: ['Invalid date'] },
      });
    }

    const tasks = await listTasks(req.userId, dateStrRaw);
    res.json({ date: dateStrRaw, tasks });
  },

  async patchStatus(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params as { id: string };
    if (!id) {
      throw new HttpError(400, 'Validation error', { code: 'VALIDATION_ERROR' });
    }

    const task = await updateTaskStatus(req.userId, id, req.body.isDone);
    res.json(task);
  },
};
