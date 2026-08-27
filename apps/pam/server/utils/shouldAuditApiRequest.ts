/**
 * Decide whether an HTTP API call should write a `request_logs` row.
 *
 * Default is **deny** (allowlist). High-frequency reads (session / search /
 * categories / detail / locales / request-logs paging / CLI device polls)
 * must not flood the table. Auth login/logout already use `insertWithAuth`
 * and are intentionally omitted here to avoid duplicate rows.
 *
 * Keep this list small: mutations + sensitive access only.
 */

type AuditRule = {
  readonly method: string | readonly string[];
  /** Exact pathname, or RegExp matched against pathname. */
  readonly path: string | RegExp;
};

const AUDIT_RULES: readonly AuditRule[] = [
  // Account / session mutations (OTP & register lack insertWithAuth).
  { method: 'POST', path: '/api/user/register' },
  { method: 'POST', path: '/api/user/otp/login' },
  { method: 'POST', path: '/api/user/otp/verify' },
  { method: 'POST', path: '/api/user/login/provider' },
  { method: 'POST', path: '/api/user/login/brain' },

  // Project mutations
  { method: 'POST', path: '/api/pam/create' },
  { method: 'POST', path: /^\/api\/pam\/edit\/[^/]+$/ },
  { method: 'POST', path: /^\/api\/pam\/delete\/[^/]+$/ },
  { method: 'POST', path: /^\/api\/pam\/fork\/[^/]+$/ },
  { method: 'POST', path: /^\/api\/pam\/transfer\/[^/]+$/ },
  { method: 'POST', path: /^\/api\/pam\/preview-image\/[^/]+$/ },

  // Environment mutations + secret export
  { method: 'POST', path: /^\/api\/pam\/[^/]+\/environments$/ },
  {
    method: 'POST',
    path: /^\/api\/pam\/[^/]+\/environments\/[^/]+\/delete$/
  },
  {
    method: 'POST',
    path: /^\/api\/pam\/[^/]+\/environments\/[^/]+\/variables$/
  },

  // Developer OAuth client mutations + consent
  { method: 'POST', path: '/api/clients' },
  {
    method: ['PUT', 'DELETE'],
    path: /^\/api\/clients\/[^/]+$/
  },
  {
    method: 'POST',
    path: /^\/api\/clients\/[^/]+\/rotate-secret$/
  },
  { method: 'POST', path: '/api/oauth/consent' },

  // CLI: user-visible approve / code only (device/token polling is noisy)
  { method: 'POST', path: '/api/pam/cli/device/approve' },
  { method: 'POST', path: '/api/pam/cli/device/code' }
];

function methodMatches(
  method: string,
  ruleMethod: string | readonly string[]
): boolean {
  const upper = method.toUpperCase();
  if (typeof ruleMethod === 'string') {
    return ruleMethod.toUpperCase() === upper;
  }
  return ruleMethod.some((item) => item.toUpperCase() === upper);
}

function pathMatches(pathname: string, rulePath: string | RegExp): boolean {
  if (typeof rulePath === 'string') {
    return pathname === rulePath;
  }
  return rulePath.test(pathname);
}

/**
 * Returns true when this request should be persisted to `request_logs`.
 */
export function shouldAuditApiRequest(
  method: string,
  pathname: string
): boolean {
  return AUDIT_RULES.some(
    (rule) =>
      methodMatches(method, rule.method) && pathMatches(pathname, rule.path)
  );
}
