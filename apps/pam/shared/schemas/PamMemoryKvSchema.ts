import { z } from 'zod';

export const pamMemoryKvAdminEntrySchema = z.object({
  key: z.string(),
  value: z.unknown(),
  bytes: z.number().int().nonnegative(),
  expiresAtMs: z.number().nullable(),
  ttlMs: z.number().nullable()
});

export type PamMemoryKvAdminEntry = z.infer<typeof pamMemoryKvAdminEntrySchema>;

export const pamMemoryKvListResultSchema = z.object({
  entries: z.array(pamMemoryKvAdminEntrySchema),
  total: z.number().int().nonnegative()
});

export type PamMemoryKvListResult = z.infer<typeof pamMemoryKvListResultSchema>;

export const pamMemoryKvPurgeSchema = z
  .object({
    key: z.string().trim().min(1).optional(),
    prefix: z.string().trim().min(1).optional(),
    all: z.boolean().optional()
  })
  .refine((value) => Boolean(value.all || value.key || value.prefix), {
    message: 'Specify key, prefix, or all'
  });

export type PamMemoryKvPurgeBody = z.infer<typeof pamMemoryKvPurgeSchema>;

export const pamMemoryKvPurgeResultSchema = z.object({
  removed: z.number().int().nonnegative()
});

export type PamMemoryKvPurgeResult = z.infer<
  typeof pamMemoryKvPurgeResultSchema
>;
