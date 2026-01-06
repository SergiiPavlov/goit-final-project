import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { parseDateYYYYMMDD } from '../../utils/time.js';

export type CreateDiaryInput = {
  title: string;
  description: string;
  date?: string; // YYYY-MM-DD
  emotions: string[]; // emotion ids
};

export type UpdateDiaryInput = {
  title?: string;
  description?: string;
  date?: string;
  emotions?: string[];
};

function getTodayUtcDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function assertEmotionsExist(emotionIds: string[]) {
  const uniqueIds = Array.from(new Set(emotionIds));
  const found = await prisma.emotion.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  const foundSet = new Set(found.map((e) => e.id));
  const missing = uniqueIds.filter((id) => !foundSet.has(id));
  if (missing.length > 0) {
    throw new HttpError(400, 'Validation error', {
      code: 'VALIDATION_ERROR',
      details: { emotions: ['Some emotions do not exist', ...missing.map((m) => `Missing: ${m}`)] },
    });
  }
}

function mapDiary(entry: any) {
  return {
    ...entry,
    emotions: (entry.emotions ?? []).map((x: any) => ({
      id: x.emotion.id,
      title: x.emotion.title,
    })),
  };
}

export async function createDiaryEntry(userId: string, input: CreateDiaryInput) {
  const date = input.date ? parseDateYYYYMMDD(input.date) : getTodayUtcDate();
  await assertEmotionsExist(input.emotions);

  const entry = await prisma.diaryEntry.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      date,
      emotions: {
        create: input.emotions.map((emotionId) => ({ emotionId })),
      },
    },
    include: {
      emotions: { include: { emotion: true } },
    },
  });

  return mapDiary(entry);
}

export async function listDiaryEntries(userId: string, dateStr: string) {
  const date = parseDateYYYYMMDD(dateStr);

  const entries = await prisma.diaryEntry.findMany({
    where: { userId, date },
    orderBy: [{ createdAt: 'desc' }],
    include: { emotions: { include: { emotion: true } } },
  });

  return entries.map(mapDiary);
}

export async function updateDiaryEntry(userId: string, entryId: string, input: UpdateDiaryInput) {
  const existing = await prisma.diaryEntry.findFirst({ where: { id: entryId, userId } });
  if (!existing) {
    throw new HttpError(404, 'Diary entry not found', { code: 'NOT_FOUND' });
  }

  const data: any = {};
  if (typeof input.title === 'string') data.title = input.title;
  if (typeof input.description === 'string') data.description = input.description;
  if (typeof input.date === 'string') data.date = parseDateYYYYMMDD(input.date);

  const tx: any[] = [];
  if (Object.keys(data).length > 0) {
    tx.push(
      prisma.diaryEntry.update({
        where: { id: entryId },
        data,
      }),
    );
  }

  if (Array.isArray(input.emotions)) {
    await assertEmotionsExist(input.emotions);
    tx.push(prisma.diaryEntryEmotion.deleteMany({ where: { diaryEntryId: entryId } }));
    tx.push(
      prisma.diaryEntryEmotion.createMany({
        data: input.emotions.map((emotionId) => ({ diaryEntryId: entryId, emotionId })),
      }),
    );
  }

  if (tx.length > 0) {
    await prisma.$transaction(tx);
  }

  const entry = await prisma.diaryEntry.findUnique({
    where: { id: entryId },
    include: { emotions: { include: { emotion: true } } },
  });

  return mapDiary(entry);
}

export async function deleteDiaryEntry(userId: string, entryId: string) {
  const existing = await prisma.diaryEntry.findFirst({ where: { id: entryId, userId } });
  if (!existing) {
    throw new HttpError(404, 'Diary entry not found', { code: 'NOT_FOUND' });
  }

  // Ensure join rows are removed as well (explicit delete to avoid FK issues).
  await prisma.$transaction([
    prisma.diaryEntryEmotion.deleteMany({ where: { diaryEntryId: entryId } }),
    prisma.diaryEntry.delete({ where: { id: entryId } }),
  ]);

  return { ok: true };
}
