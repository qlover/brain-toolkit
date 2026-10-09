import { extractPostgrestError } from '@brain-toolkit/next-app-kit/shared';

/** RPC not deployed yet — caller may fall back to PostgREST search. */
export function isPamSearchRpcUnavailable(error: unknown): boolean {
  const pg = extractPostgrestError(error);
  if (pg?.code === 'PGRST202') {
    return true;
  }
  const message = (pg?.message ?? '').toLowerCase();
  return (
    message.includes('pam_search_projects') &&
    (message.includes('could not find') ||
      message.includes('schema cache') ||
      message.includes('function'))
  );
}
