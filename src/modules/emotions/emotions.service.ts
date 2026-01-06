import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';

export type EmotionDTO = {
  id: string;
  title: string;
};

export async function listEmotions(): Promise<EmotionDTO[]> {
  return prisma.emotion.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });
}

export async function getEmotionById(id: string): Promise<EmotionDTO> {
  const emotion = await prisma.emotion.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!emotion) {
    throw new HttpError(404, 'Emotion not found', { code: 'NOT_FOUND' });
  }

  return emotion;
}
