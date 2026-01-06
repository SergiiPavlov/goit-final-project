import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { parseDateYYYYMMDD } from '../../utils/time.js';

export type CreateTaskInput = {
  name: string;
  date: string; // YYYY-MM-DD
  isDone?: boolean;
};

export async function createTask(userId: string, input: CreateTaskInput) {
  const date = parseDateYYYYMMDD(input.date);

  // Validation: date must be today or later (curDate).
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (date.getTime() < todayUtc.getTime()) {
    throw new HttpError(400, 'Validation error', {
      code: 'VALIDATION_ERROR',
      details: { date: ['date must be today or later'] },
    });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      name: input.name,
      date,
      isDone: Boolean(input.isDone ?? false),
    },
  });

  return task;
}

export async function listTasks(userId: string, dateStr: string) {
  const date = parseDateYYYYMMDD(dateStr);

  const tasks = await prisma.task.findMany({
    where: { userId, date },
    orderBy: [{ createdAt: 'asc' }],
  });

  return tasks;
}

export async function updateTaskStatus(userId: string, taskId: string, isDone: boolean) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) {
    throw new HttpError(404, 'Task not found', { code: 'NOT_FOUND' });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isDone },
  });

  return task;
}
