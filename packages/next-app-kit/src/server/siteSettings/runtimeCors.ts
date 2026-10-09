import type { CorsRule } from '../../shared/siteSettings';

export const DEFAULT_CORS_METHODS: readonly string[] = Object.freeze([
  'GET',
  'POST',
  'OPTIONS'
]);

/** Shape accepted by next-kit `buildApiCorsHeaders` / `apiCorsPreflightResponse`. */
export type RuntimeCorsConfig = {
  readonly apiCorsAllowedOrigins: readonly string[];
  readonly apiCorsAllowedMethods: readonly string[];
  readonly apiCorsRules: readonly CorsRule[];
};

export function buildRuntimeCorsConfig(
  rules: readonly CorsRule[],
  methods: readonly string[]
): RuntimeCorsConfig {
  return {
    apiCorsAllowedOrigins: Object.freeze([]),
    apiCorsAllowedMethods: Object.freeze(
      methods.length > 0 ? [...methods] : [...DEFAULT_CORS_METHODS]
    ),
    apiCorsRules: Object.freeze(
      rules.map((rule) => ({
        origin: rule.origin,
        path: rule.path,
        methods: [...rule.methods]
      }))
    )
  };
}

/** Env `API_CORS_ALLOWED_ORIGINS` → one allow-all-paths rule per origin. */
export function envCorsRules(origins: readonly string[]): CorsRule[] {
  return origins.map((origin) => ({ origin, path: '*', methods: ['*'] }));
}
