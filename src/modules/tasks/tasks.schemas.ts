import { z } from 'zod';

// task form
// name - min: 1, max: 96, required,
// date - string format 'YYYY-MM-DD', min: curDate,
// isDone - boolean, default: false

export const createTaskSchema = z
  .object({
    name: z.string().trim().min(1).max(96),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    isDone: z.boolean().optional().default(false),
  })
  .strict();

export const updateTaskStatusSchema = z
  .object({
    isDone: z.boolean(),
  })
  .strict();
