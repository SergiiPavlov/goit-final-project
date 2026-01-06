import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function utcToday(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function diffDaysUtc(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function pickRandom<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx] ?? null;
}

export async function getWeekBabyState(weekNumber: number) {
  const row = await prisma.weekBabyState.findUnique({ where: { weekNumber } });
  if (!row) throw new HttpError(404, 'Week not found', { code: 'NOT_FOUND' });
  return row;
}

export async function getWeekMomState(weekNumber: number) {
  const row = await prisma.weekMomState.findUnique({ where: { weekNumber } });
  if (!row) throw new HttpError(404, 'Week not found', { code: 'NOT_FOUND' });
  return row;
}

export async function getWeekDashboardInfo(weekNumber: number) {
  const [baby, mom] = await Promise.all([getWeekBabyState(weekNumber), getWeekMomState(weekNumber)]);

  const momDailyTip = pickRandom(baby.momDailyTips);

  // comfortTips is stored as Json; keep it as-is but try to pick a tip if it is an array.
  const comfortTipsAny = mom.comfortTips as unknown;
  const comfortTip = Array.isArray(comfortTipsAny) ? pickRandom(comfortTipsAny) : null;

  return {
    weekNumber,
    baby: {
      weekNumber: baby.weekNumber,
      analogy: baby.analogy,
      babySize: baby.babySize,
      babyWeight: baby.babyWeight,
      image: baby.image,
    },
    momTip: {
      dailyTip: momDailyTip,
      comfortTip,
    },
  };
}

export async function getCurrentWeekInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dueDate: true },
  });

  if (!user) throw new HttpError(404, 'User not found', { code: 'NOT_FOUND' });

  const today = utcToday();

  // If dueDate is not set, assume it's 40 weeks from today (week 1).
  const dueDate = user.dueDate ? new Date(Date.UTC(user.dueDate.getUTCFullYear(), user.dueDate.getUTCMonth(), user.dueDate.getUTCDate())) : new Date(today.getTime() + 280 * 24 * 60 * 60 * 1000);
  const daysToChildbirth = Math.max(0, diffDaysUtc(today, dueDate));

  // Week 40 is the due date week. Clamp to [1..40].
  const currentWeek = clamp(40 - Math.floor(daysToChildbirth / 7), 1, 40);

  const dashboard = await getWeekDashboardInfo(currentWeek);

  return {
    ...dashboard,
    daysToChildbirth,
  };
}
