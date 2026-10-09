import {
  BRAIN_DOMAINS,
  GATEWAY_BRAIN_USER_ENDPOINTS,
  defaultEnv,
  type BrainUserGatewayConfig
} from '@brain-toolkit/brain-user';
import { z } from 'zod';
import type { UserSchema } from '@qlover/next-kit/common';

/**
 * Admin-editable part of `BrainUserGatewayConfig`: only the fields that decide
 * request addresses. `domains` / `endpoints` are merged over the defaults.
 */
export type BrainApiGatewaySettings = Pick<
  BrainUserGatewayConfig<unknown>,
  'env' | 'domains' | 'userlyDomains' | 'endpoints'
> & {
  /**
   * Per-env endpoint overrides merged over `endpoints`, e.g. a proxy site
   * that exposes Brain under its own paths.
   */
  envEndpoints?: Record<string, BrainApiEndpointMap>;
};

export type BrainApiEndpointKey = keyof typeof GATEWAY_BRAIN_USER_ENDPOINTS;

export type BrainApiEndpointMap = Partial<Record<BrainApiEndpointKey, string>>;

export const BRAIN_API_ENDPOINT_KEYS = Object.freeze(
  Object.keys(GATEWAY_BRAIN_USER_ENDPOINTS)
) as readonly BrainApiEndpointKey[];

export const BRAIN_API_DEFAULT_ENV: string = defaultEnv;

/** Login page choice; validated server-side against the configured domains. */
export const BRAIN_LOGIN_ENV_COOKIE = 'brain_login_env';

/** Env of local users and links created before per-env login. */
export const BRAIN_LEGACY_ENV = 'development';

/** Session user as returned by the server; `brain_env` is the login env. */
export type BrainSessionUser = UserSchema & { brain_env?: string };

export function brainEnvOfUser(user: unknown): string | undefined {
  const env = (user as BrainSessionUser | null | undefined)?.brain_env;
  return typeof env === 'string' && env.trim() ? env : undefined;
}

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

const endpointMapSchema = z.partialRecord(
  z.enum(BRAIN_API_ENDPOINT_KEYS),
  endpointSchema
);

export const brainApiGatewaySettingsSchema = z
  .object({
    env: z.string().trim().min(1).optional(),
    domains: domainMapSchema.optional(),
    userlyDomains: domainMapSchema.optional(),
    endpoints: endpointMapSchema.optional(),
    envEndpoints: z
      .record(z.string().trim().min(1), endpointMapSchema)
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
  });

export interface BrainApiTarget {
  readonly config: BrainApiGatewaySettings & {
    env: string;
    domains: Record<string, string>;
  };
  /** Origin for every endpoint of the default env except `accessToken`. */
  readonly baseURL: string;
  /** Origin for `accessToken` (`userlyDomains`, else {@link baseURL}). */
  readonly userlyBaseURL: string;
}

/** Request addresses of one env. */
export interface BrainApiEnvTarget {
  readonly baseURL: string;
  readonly userlyBaseURL: string;
  readonly endpoints: NonNullable<BrainApiGatewaySettings['endpoints']>;
}

export function resolveBrainApiEnv(
  config: BrainApiTarget['config'],
  env: string
): BrainApiEnvTarget {
  const baseURL = config.domains[env] ?? '';
  return {
    baseURL,
    userlyBaseURL: config.userlyDomains?.[env] ?? baseURL,
    endpoints: {
      ...BRAIN_API_DEFAULT_ENDPOINTS,
      ...config.endpoints,
      ...config.envEndpoints?.[env]
    } as BrainApiEnvTarget['endpoints']
  };
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
  const config = { ...settings, env, domains };
  const { baseURL, userlyBaseURL } = resolveBrainApiEnv(config, env);
  return { config, baseURL, userlyBaseURL };
}

export interface BrainApiDomainRow {
  name: string;
  url: string;
  /** Preset rows (`BRAIN_DOMAINS`) can be edited but not removed. */
  preset: boolean;
  /** Access token origin; empty means same as {@link url}. */
  userlyUrl: string;
  /** Path overrides for this env; empty means the shared endpoint path. */
  paths: Partial<Record<BrainApiEndpointKey, string>>;
}

export interface BrainApiEndpointRow {
  method: string;
  path: string;
}

/** Form state of the admin "Brain API" card. */
export interface BrainApiForm {
  env: string;
  domains: BrainApiDomainRow[];
  endpoints: Record<BrainApiEndpointKey, BrainApiEndpointRow>;
}

export function settingsToBrainApiForm(
  settings: BrainApiGatewaySettings
): BrainApiForm {
  const env = settings.env ?? defaultEnv;
  const custom = settings.domains ?? {};
  const toRow = (
    name: string,
    url: string,
    preset: boolean
  ): BrainApiDomainRow => ({
    name,
    url,
    preset,
    userlyUrl: settings.userlyDomains?.[name] ?? '',
    paths: Object.fromEntries(
      Object.entries(settings.envEndpoints?.[name] ?? {}).map(
        ([key, endpoint]) => [key, splitEndpoint(endpoint).path]
      )
    )
  });
  const domains: BrainApiDomainRow[] = [
    ...Object.entries(BRAIN_DOMAINS).map(([name, url]) =>
      toRow(name, custom[name] ?? url, true)
    ),
    ...Object.entries(custom)
      .filter(([name]) => !(name in BRAIN_DOMAINS))
      .map(([name, url]) => toRow(name, url, false))
  ];
  const endpoints = Object.fromEntries(
    BRAIN_API_ENDPOINT_KEYS.map((key) => [
      key,
      splitEndpoint(
        settings.endpoints?.[key] ?? BRAIN_API_DEFAULT_ENDPOINTS[key]
      )
    ])
  ) as BrainApiForm['endpoints'];

  return { env, domains, endpoints };
}

/** Only values that differ from the package defaults are kept. */
export function brainApiFormToSettings(
  form: BrainApiForm
): BrainApiGatewaySettings {
  const domains: Record<string, string> = {};
  const userlyDomains: Record<string, string> = {};
  const envEndpoints: Record<string, BrainApiEndpointMap> = {};
  for (const row of form.domains) {
    const name = row.name.trim();
    if (!name) {
      continue;
    }
    const url = trimUrl(row.url);
    if (
      !row.preset ||
      BRAIN_DOMAINS[name as keyof typeof BRAIN_DOMAINS] !== url
    ) {
      domains[name] = url;
    }
    if (row.userlyUrl.trim()) {
      userlyDomains[name] = trimUrl(row.userlyUrl);
    }
    const overrides: BrainApiEndpointMap = {};
    for (const key of BRAIN_API_ENDPOINT_KEYS) {
      const path = row.paths[key]?.trim();
      if (path) {
        overrides[key] = `${form.endpoints[key].method} ${path}`;
      }
    }
    if (Object.keys(overrides).length > 0) {
      envEndpoints[name] = overrides;
    }
  }

  const endpoints: BrainApiEndpointMap = {};
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
  if (Object.keys(userlyDomains).length > 0) {
    settings.userlyDomains = userlyDomains;
  }
  if (Object.keys(endpoints).length > 0) {
    settings.endpoints = endpoints as BrainApiGatewaySettings['endpoints'];
  }
  if (Object.keys(envEndpoints).length > 0) {
    settings.envEndpoints = envEndpoints;
  }
  return settings;
}

function trimUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/** Stored form of {@link BrainApiGatewaySettings}; empty means defaults. */
export function serializeBrainApiSettings(
  settings: BrainApiGatewaySettings
): string {
  return Object.keys(settings).length > 0
    ? JSON.stringify(settings, null, 2)
    : '';
}
