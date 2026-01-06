import { z } from 'zod';

// diary form
// title - min: 1, max: 64, required,
// description - min: 1, max: 1000, required,
// date - string format 'YYYY-MM-DD', default: curDate,
// emotions - array of emotions ids, min: 1, max: 12, required.

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const createDiarySchema = z
  .object({
    title: z.string().trim().min(1).max(64),
    description: z.string().trim().min(1).max(1000),
    // In UI date field is absent; backend sets current date by default.
    date: dateSchema.optional(),
    emotions: z.array(z.string().min(1)).min(1).max(12),
  })
  .strict();

// PATCH: allow partial updates, but require at least one field.
export const updateDiarySchema = z
  .object({
    title: z.string().trim().min(1).max(64).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    date: dateSchema.optional(),
    emotions: z.array(z.string().min(1)).min(1).max(12).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided' });
