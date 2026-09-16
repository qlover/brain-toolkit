import { i18nKeySchema } from '@qlover/next-kit/common';
import { z } from 'zod';
import { i18nConfig, type LocaleType } from '@config/i18n';

const localeEnum = z.enum(
  i18nConfig.supportedLngs as unknown as [LocaleType, ...LocaleType[]]
);

/** One row for one locale (Prisma-style single-language admin list). */
export const pamAdminLocaleItemSchema = z.object({
  id: z.number().int(),
  value: z.string(),
  namespace: z.string(),
  description: z.string(),
  locale: localeEnum,
  text: z.string(),
  updated_at: z.union([z.string(), z.number()]).optional()
});

export type PamAdminLocaleItem = z.infer<typeof pamAdminLocaleItemSchema>;

export const pamAdminLocaleCreateSchema = z.object({
  value: i18nKeySchema,
  locale: localeEnum,
  text: z.string().default(''),
  description: z.string().optional(),
  namespace: z.string().min(1).optional()
});

export type PamAdminLocaleCreate = z.infer<typeof pamAdminLocaleCreateSchema>;

export const pamAdminLocaleUpdateSchema = z.object({
  id: z.number().int().positive(),
  locale: localeEnum,
  text: z.string().optional(),
  description: z.string().optional()
});

export type PamAdminLocaleUpdate = z.infer<typeof pamAdminLocaleUpdateSchema>;

export const pamAdminLocalesImportResultSchema = z.object({
  totalCount: z.number().int(),
  successCount: z.number().int(),
  failureCount: z.number().int()
});

export type PamAdminLocalesImportResult = z.infer<
  typeof pamAdminLocalesImportResultSchema
>;

export function isSupportedAdminLocale(value: string): value is LocaleType {
  return (i18nConfig.supportedLngs as readonly string[]).includes(value);
}
