import { NextApiServer } from '@server/NextApiServer';
import { OAuthAuthorizeService } from '@server/oauth/services/OAuthAuthorizeService';
import type { NextRequest } from 'next/server';

/**
 * Validates OAuth authorize query parameters against registered clients (playground).
 */
export async function GET(req: NextRequest) {
  const rawQuery = Object.fromEntries(req.nextUrl.searchParams.entries());

  return await new NextApiServer(
    '/api/oauth/playground/validate',
    req
  ).runWithJson(async ({ parameters: { IOC } }) => {
    const resolved = await IOC(OAuthAuthorizeService).resolveAuthorizePage(
      rawQuery
    );
    if (!resolved.ok) {
      return {
        valid: false as const,
        error: resolved.error
      };
    }
    return {
      valid: true as const,
      data: resolved.data
    };
  });
}
