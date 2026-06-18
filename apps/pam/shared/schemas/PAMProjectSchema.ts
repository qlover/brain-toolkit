import { z } from 'zod';

export const PAMPublicType = {
  public: 1,
  private: 0
} as const;

/**
 * 数据库中用于 tsvector 列名字
 * @see makes/sql/003-pam-base.sql
 */
export const PAMPROJECT_TSVECTOR_KEY = 'search_vector' as const;

export const PAMProjectSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  stack: z.string().optional(),
  repo_url: z.string().optional(),
  category: z.string(),
  /**
   * 0: private, 1: public
   */
  is_public: z.enum(PAMPublicType),
  owner_id: z.uuid(),
  created_at: z.union([z.string(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

export const PAMProjectSafeFields = Object.keys(
  PAMProjectSchema.omit({
    owner_id: true
  }).shape
) as (keyof PAMProjectSchemaType)[];

export type PAMProjectSchemaType = z.infer<typeof PAMProjectSchema>;

export const PAMEnvironmentsSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  name: z.string(),
  url: z.string(),
  variables: z.json().optional(),
  created_at: z.union([z.string(), z.number()]), // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
  updated_at: z.union([z.string(), z.number()]) // Support both string (TIMESTAMPTZ) and number (Unix timestamp)
});

export type PAMEnvironmentsSchemaType = z.infer<typeof PAMEnvironmentsSchema>;
