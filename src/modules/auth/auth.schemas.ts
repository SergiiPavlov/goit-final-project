import { z } from 'zod';

import { parseDateYYYYMMDD } from '../../utils/time.js';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function dateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function isWithinDueDateWindow(value: string): boolean {
  // min: curDate + 1 week, max: curDate + 40 weeks
  let due: Date;
  try {
    due = parseDateYYYYMMDD(value);
  } catch {
    return false;
  }

  const today = dateOnlyUTC(new Date());
  const min = addDaysUTC(today, 7);
  const max = addDaysUTC(today, 280);

  return due >= min && due <= max;
}

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(32),
  email: z.string().trim().email().max(64),
  password: z.string().min(8).max(128),
  gender: z.enum(['boy', 'girl']).nullable().optional(),
  dueDate: z
    .string()
    .regex(dateRegex, "dueDate must be in format 'YYYY-MM-DD'")
    .refine(isWithinDueDateWindow, 'dueDate must be between current date + 1 week and current date + 40 weeks')
    .nullable()
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(64),
  password: z.string().min(8).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  // Optional: if provided, we will invalidate only that session. Otherwise invalidate all sessions for the user.
  refreshToken: z.string().min(1).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
