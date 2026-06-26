import { z } from 'zod';

export const PAMEnvTableName = 'pam_environments' as const;

export const PAMVariableSchema = z.object({
  id: z.uuid().optional(),
  key: z.string().trim().min(1, 'Key can not be empty'),
  value: z.string().trim().min(1, 'Value can not be empty')
});
export type PAMVariable = z.infer<typeof PAMVariableSchema>;

export const PAMEnvRawSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  name: z.string().trim().min(1),
  url: z.url(),
  variables: z.array(PAMVariableSchema).optional(),
  created_at: z.union([z.string().trim(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string().trim(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

export type PAMEnvRaw = z.infer<typeof PAMEnvRawSchema>;

export const PAMEnvWriteableSchema = PAMEnvRawSchema.pick({
  id: true,
  name: true,
  url: true,
  variables: true
});

export type PAMEnvWriteable = z.infer<typeof PAMEnvWriteableSchema>;
