/** Rebuilds a query string from Next.js `searchParams` (repeated keys kept). */
export function toSearchString(
  query: Record<string, string | string[] | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) {
        search.append(key, item);
      }
    }
  }
  return search.toString();
}

/**
 * Login URL that signs in and then returns to the same authorize request
 * (used by the "switch account" link on the consent card).
 */
export function buildSwitchAccountHref(
  loginPath: string,
  authorizePath: string,
  query: Record<string, string | string[] | undefined>
): string {
  const search = toSearchString(query);
  const returnTo = search ? `${authorizePath}?${search}` : authorizePath;
  return `${loginPath}?redirect=${encodeURIComponent(returnTo)}`;
}
