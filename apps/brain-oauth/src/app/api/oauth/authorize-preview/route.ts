import { API_OAUTH_AUTHORIZE_PREVIEW } from '@config/route';
import { OAuthWrapperController } from '@server/controllers/OAuthWrapperController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

/**
 * Public preview of the app behind an authorize request (query = the authorize
 * query string). `data` is `null` when the request does not validate.
 */
export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams);

  return await new NextApiServer(API_OAUTH_AUTHORIZE_PREVIEW, req).runWithJson(
    async ({ parameters: { IOC } }) =>
      IOC(OAuthWrapperController).previewAuthorizeClient(query)
  );
}
