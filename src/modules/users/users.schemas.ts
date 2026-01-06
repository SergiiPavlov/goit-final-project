import { z } from 'zod';

// Validation rules are aligned with project requirements.

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(32).optional(),
    gender: z.enum(['boy', 'girl']).nullable().optional(),
    // ISO date (YYYY-MM-DD). Stored in DB as Date.
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD')
      .nullable()
      .optional(),
  })
  .strict();
