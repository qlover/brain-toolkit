import { API_PAM_CI_OIDC_AUDIENCE } from '@config/route';
import { PamCiOidcController } from '@server/controllers/PamCiOidcController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

/**
 * GET /api/pam/ci/oidc/audience?provider=github|vercel — 站点默认 OIDC audience。
 */
export async function GET(req: NextRequest) {
  return new NextApiServer(API_PAM_CI_OIDC_AUDIENCE, req).runWithJson(
    async ({ parameters: { IOC } }) => {
      return IOC(PamCiOidcController).getAudienceHint(req);
    }
  );
}
