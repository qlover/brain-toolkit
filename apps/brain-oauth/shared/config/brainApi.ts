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

export type BrainApiEndpointKey = keyof typeof GATEWAY_BRAIN_USER_ENDPOINTS;

export const BRAIN_API_ENDPOINT_KEYS = Object.freeze(
  Object.keys(GATEWAY_BRAIN_USER_ENDPOINTS)
) as readonly BrainApiEndpointKey[];

export const BRAIN_API_DEFAULT_ENV: string = defaultEnv;

/** Login page choice; validated server-side against the configured domains. */
export const BRAIN_LOGIN_ENV_COOKIE = 'brain_login_env';

/** Env of local users and links created before per-env login. */
export const BRAIN_LEGACY_ENV = 'development';

/** `GET /api/brain/envs` payload for the login page env switcher. */
export interface BrainLoginEnvs {
  envs: string[];
  defaultEnv: string;
}

export const BRAIN_API_PRESET_DOMAINS: Readonly<Record<string, string>> =
  BRAIN_DOMAINS;

export const BRAIN_API_DEFAULT_ENDPOINTS: Readonly<
  Record<BrainApiEndpointKey, string>
> = GATEWAY_BRAIN_USER_ENDPOINTS;

export const BRAIN_API_HTTP_METHODS = Object.freeze([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'HEAD'
] as const);

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function splitEndpoint(endpoint: string): {
  method: string;
  path: string;
} {
  const [method = 'GET', path = ''] = endpoint.trim().split(/\s+/, 2);
  return { method: method.toUpperCase(), path };
}

const httpUrlSchema = z
  .string()
  .trim()
  .refine(isHttpUrl, 'Must be an http(s) URL')
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

export interface BrainApiDomainRow {
  name: string;
  url: string;
  /** Preset rows (`BRAIN_DOMAINS`) can be edited but not removed. */
  preset: boolean;
}

export interface BrainApiEndpointRow {
  method: string;
  path: string;
}

/** Form state of the admin "Brain API" card. */
export interface BrainApiForm {
  env: string;
  domains: BrainApiDomainRow[];
  /** Access token origin for {@link env}; empty means same as the domain. */
  userlyUrl: string;
  endpoints: Record<BrainApiEndpointKey, BrainApiEndpointRow>;
}

export function settingsToBrainApiForm(
  settings: BrainApiGatewaySettings
): BrainApiForm {
  const env = settings.env ?? defaultEnv;
  const custom = settings.domains ?? {};
  const domains: BrainApiDomainRow[] = [
    ...Object.entries(BRAIN_DOMAINS).map(([name, url]) => ({
      name,
      url: custom[name] ?? url,
      preset: true
    })),
    ...Object.entries(custom)
      .filter(([name]) => !(name in BRAIN_DOMAINS))
      .map(([name, url]) => ({ name, url, preset: false }))
  ];
  const endpoints = Object.fromEntries(
    BRAIN_API_ENDPOINT_KEYS.map((key) => [
      key,
      splitEndpoint(
        settings.endpoints?.[key] ?? BRAIN_API_DEFAULT_ENDPOINTS[key]
      )
    ])
  ) as BrainApiForm['endpoints'];

  return {
    env,
    domains,
    userlyUrl: settings.userlyDomains?.[env] ?? '',
    endpoints
  };
}

/** Only values that differ from the package defaults are kept. */
export function brainApiFormToSettings(
  form: BrainApiForm
): BrainApiGatewaySettings {
  const domains: Record<string, string> = {};
  for (const row of form.domains) {
    const name = row.name.trim();
    const url = row.url.trim().replace(/\/+$/, '');
    if (
      name &&
      (!row.preset || BRAIN_DOMAINS[name as keyof typeof BRAIN_DOMAINS] !== url)
    ) {
      domains[name] = url;
    }
  }

  const endpoints: Partial<Record<BrainApiEndpointKey, string>> = {};
  for (const key of BRAIN_API_ENDPOINT_KEYS) {
    const { method, path } = form.endpoints[key];
    const value = `${method} ${path.trim()}`;
    if (value !== BRAIN_API_DEFAULT_ENDPOINTS[key]) {
      endpoints[key] = value;
    }
  }

  const settings: BrainApiGatewaySettings = {};
  if (form.env !== defaultEnv) settings.env = form.env;
  if (Object.keys(domains).length > 0) settings.domains = domains;
  if (form.userlyUrl.trim()) {
    settings.userlyDomains = { [form.env]: form.userlyUrl.trim() };
  }
  if (Object.keys(endpoints).length > 0) {
    settings.endpoints = endpoints as BrainApiGatewaySettings['endpoints'];
  }
  return settings;
}

/** Stored form of {@link BrainApiGatewaySettings}; empty means defaults. */
export function serializeBrainApiSettings(
  settings: BrainApiGatewaySettings
): string {
  return Object.keys(settings).length > 0
    ? JSON.stringify(settings, null, 2)
    : '';
}
