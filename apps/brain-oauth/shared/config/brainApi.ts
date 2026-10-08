import {
  BRAIN_DOMAINS,
  GATEWAY_BRAIN_USER_ENDPOINTS,
  defaultEnv,
  type BrainUserGatewayConfig
} from '@brain-toolkit/brain-user';
import { z } from 'zod';

/**
 * Admin-editable part of `BrainUserGatewayConfig`: only the fields that decide
 * request addresses. `domains` / `endpoints` are merged over the defaults.
 */
export type BrainApiGatewaySettings = Pick<
  BrainUserGatewayConfig<unknown>,
  'env' | 'domains' | 'userlyDomains' | 'endpoints'
>;

export const BRAIN_API_ENDPOINT_KEYS = Object.freeze(
  Object.keys(GATEWAY_BRAIN_USER_ENDPOINTS)
) as readonly (keyof typeof GATEWAY_BRAIN_USER_ENDPOINTS)[];

const httpUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }, 'Must be an http(s) URL')
  .transform((value) => value.replace(/\/+$/, ''));

const endpointSchema = z
  .string()
  .trim()
  .regex(
    /^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD) \/\S*$/,
    'Must look like "POST /path"'
  );

const domainMapSchema = z.record(z.string().trim().min(1), httpUrlSchema);

export const brainApiGatewaySettingsSchema = z
  .object({
    env: z.string().trim().min(1).optional(),
    domains: domainMapSchema.optional(),
    userlyDomains: domainMapSchema.optional(),
    endpoints: z
      .partialRecord(z.enum(BRAIN_API_ENDPOINT_KEYS), endpointSchema)
      .optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    const env = value.env ?? defaultEnv;
    const domains = { ...BRAIN_DOMAINS, ...value.domains };
    if (!(env in domains)) {
      ctx.addIssue({
        code: 'custom',
        path: ['env'],
        message: `env "${env}" is not a key of domains`
      });
    }
    if (value.userlyDomains && !(env in value.userlyDomains)) {
      ctx.addIssue({
        code: 'custom',
        path: ['userlyDomains'],
        message: `userlyDomains has no "${env}" entry`
      });
    }
  });

export interface BrainApiTarget {
  /** Options for `createBrainUserOptions`. */
  readonly config: BrainApiGatewaySettings & {
    env: string;
    domains: Record<string, string>;
  };
  /** Origin for every endpoint except `accessToken`. */
  readonly baseURL: string;
  /** Origin for `accessToken` (`userlyDomains`, else {@link baseURL}). */
  readonly userlyBaseURL: string;
}

export type BrainApiSettingsParseResult =
  | { success: true; settings: BrainApiGatewaySettings }
  | { success: false; error: string };

/** Accepts the stored JSON string; empty means package defaults. */
export function parseBrainApiSettings(
  raw: string
): BrainApiSettingsParseResult {
  if (!raw.trim()) {
    return { success: true, settings: {} };
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
  const parsed = brainApiGatewaySettingsSchema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n')
    };
  }
  return { success: true, settings: parsed.data as BrainApiGatewaySettings };
}

export function resolveBrainApiTarget(
  settings: BrainApiGatewaySettings
): BrainApiTarget {
  const env = settings.env ?? defaultEnv;
  const domains: Record<string, string> = {
    ...BRAIN_DOMAINS,
    ...settings.domains
  };
  const baseURL = domains[env] ?? '';
  return {
    config: { ...settings, env, domains },
    baseURL,
    userlyBaseURL: settings.userlyDomains?.[env] ?? baseURL
  };
}

/** Pretty JSON for the admin editor when nothing is stored yet. */
export const BRAIN_API_SETTINGS_TEMPLATE = JSON.stringify(
  { env: defaultEnv } satisfies BrainApiGatewaySettings,
  null,
  2
);
