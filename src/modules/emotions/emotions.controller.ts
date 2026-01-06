import type { Request, Response } from 'express';

import { getEmotionById, listEmotions } from './emotions.service.js';

export async function list(_req: Request, res: Response): Promise<void> {
  const emotions = await listEmotions();
  res.json(emotions);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  const emotion = await getEmotionById(id);
  res.json(emotion);
}
