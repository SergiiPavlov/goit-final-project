import { z } from 'zod';

// Validation rules are aligned with project requirements.

export const updateUserSchema = z
  .object({
    // Front-end forms may send empty strings for optional fields.
    // Treat "" as "not provided" for name, and as null for nullable fields.
    name: z.preprocess((v) => {
      if (typeof v !== 'string') return v;
      const t = v.trim();
      return t === '' ? undefined : t;
    }, z.string().min(1).max(32).optional()),
    gender: z.preprocess((v) => {
      if (v === '') return null;
      return v;
    }, z.enum(['boy', 'girl']).nullable().optional()),
    // ISO date (YYYY-MM-DD). Stored in DB as Date.
    dueDate: z.preprocess((v) => {
      if (v === '') return null;
      return v;
    },
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD')
      .nullable()
      .optional()),
  })
  .strict();
