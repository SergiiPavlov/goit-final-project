import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

import { HttpError } from '../../middleware/errorHandler.js';
import { parseDateYYYYMMDD } from '../../utils/time.js';
import {
  createDiaryEntry,
  deleteDiaryEntry,
  listDiaryEntries,
  updateDiaryEntry,
} from './diaries.service.js';

export const diariesController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const entry = await createDiaryEntry(req.userId, req.body);
    res.status(201).json(entry);
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const dateStrRaw = req.query.date as string | undefined;

    // If date is provided, validate and apply filter. If omitted, return all entries.
    if (dateStrRaw !== undefined) {
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStrRaw)) {
        throw new HttpError(400, 'Validation error', {
          code: 'VALIDATION_ERROR',
          details: { date: ['date must be YYYY-MM-DD'] },
        });
      }

      try {
        parseDateYYYYMMDD(dateStrRaw);
      } catch {
        throw new HttpError(400, 'Validation error', {
          code: 'VALIDATION_ERROR',
          details: { date: ['Invalid date'] },
        });
      }
    }

    const entries = await listDiaryEntries(req.userId, dateStrRaw);
    res.json({ date: dateStrRaw ?? null, entries });
  },

  async patch(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params as { id: string };
    if (!id) {
      throw new HttpError(400, 'Validation error', { code: 'VALIDATION_ERROR' });
    }

    const entry = await updateDiaryEntry(req.userId, id, req.body);
    res.json(entry);
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params as { id: string };
    if (!id) {
      throw new HttpError(400, 'Validation error', { code: 'VALIDATION_ERROR' });
    }

    const result = await deleteDiaryEntry(req.userId, id);
    res.json(result);
  },
};
