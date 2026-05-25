import { REQUEST_LOG_RECORD_TYPE_BRAIN_OAUTH } from '@schemas/RequestLogSchema';

/**
 * Returns {@link REQUEST_LOG_RECORD_TYPE_BRAIN_OAUTH} when `pathname` is an OAuth-related route in this app.
 */
export function resolveBrainOauthRequestLogRecordType(
  pathname: string
): typeof REQUEST_LOG_RECORD_TYPE_BRAIN_OAUTH | null {
  const path = pathname.split('?')[0]?.replace(/\/+$/, '') || '/';
  if (
    path === '/userinfo' ||
    path.startsWith('/oauth') ||
    path.startsWith('/api/oauth') ||
    path.startsWith('/api/clients') ||
    path.startsWith('/api/brain')
  ) {
    return REQUEST_LOG_RECORD_TYPE_BRAIN_OAUTH;
  }
  return null;
}
