import { BRAIN_DOMAINS } from '@brain-toolkit/brain-user';

/** Admin-selectable Brain API env; `custom` uses the configured base URL. */
export const BRAIN_API_CUSTOM_ENV = 'custom' as const;

export const BRAIN_API_DEFAULT_ENV = 'development' as const;

export const BRAIN_API_PRESET_DOMAINS: Readonly<Record<string, string>> =
  BRAIN_DOMAINS;

export const BRAIN_API_ENV_OPTIONS: readonly string[] = Object.freeze([
  ...Object.keys(BRAIN_DOMAINS),
  BRAIN_API_CUSTOM_ENV
]);

export interface BrainApiTarget {
  /** Env passed to the Brain gateway; always a key of {@link domains}. */
  readonly env: string;
  readonly domains: Record<string, string>;
  /** Resolved origin all Brain requests go to. */
  readonly baseURL: string;
}

export function isBrainApiEnv(value: string): boolean {
  return BRAIN_API_ENV_OPTIONS.includes(value);
}

export function isValidBrainApiBaseUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Trailing slashes would double up with endpoint paths. */
export function normalizeBrainApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

/**
 * Invalid input (unknown env, `custom` without a valid URL) falls back to
 * {@link BRAIN_API_DEFAULT_ENV} so a bad setting never breaks sign-in.
 */
export function resolveBrainApiTarget(
  env: string,
  customBaseUrl: string
): BrainApiTarget {
  const domains: Record<string, string> = { ...BRAIN_DOMAINS };
  const trimmedEnv = env.trim();

  if (
    trimmedEnv === BRAIN_API_CUSTOM_ENV &&
    isValidBrainApiBaseUrl(customBaseUrl)
  ) {
    const baseURL = normalizeBrainApiBaseUrl(customBaseUrl);
    domains[BRAIN_API_CUSTOM_ENV] = baseURL;
    return { env: BRAIN_API_CUSTOM_ENV, domains, baseURL };
  }

  const resolvedEnv =
    trimmedEnv in domains ? trimmedEnv : BRAIN_API_DEFAULT_ENV;
  return { env: resolvedEnv, domains, baseURL: domains[resolvedEnv] };
}
