import { NextApiServer } from '@server/NextApiServer';
import { ServerConfig } from '@server/ServerConfig';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import type { RuntimeCorsConfig } from '@server/utils/resolveRuntimeCorsConfig';
import type { NextRequest } from 'next/server';

const INTERNAL_ROUTE = '/internal/runtime-cors-config' as const;

/**
 * Loads CORS allowlists from site settings with env fallback.
 */
export async function loadRuntimeCorsConfig(
  req: NextRequest
): Promise<RuntimeCorsConfig> {
  const fallback = new ServerConfig();
  try {
    const result = await new NextApiServer(INTERNAL_ROUTE, req).run(
      async ({ parameters: { IOC } }) =>
        IOC(SiteSettingsService).getCorsConfig()
    );
    if (result.success && result.data) {
      return result.data as RuntimeCorsConfig;
    }
  } catch {
    // Fall back to env-only ServerConfig when settings cannot be loaded.
  }
  return fallback;
}
