import { z } from 'zod';

export const weekNumberParamSchema = z
  .object({
    weekNumber: z
      .string()
      .regex(/^\d+$/, 'weekNumber must be an integer')
      .transform((v) => Number(v))
      .refine((n) => Number.isInteger(n) && n >= 1 && n <= 40, 'weekNumber must be between 1 and 40'),
  })
  .strict();
