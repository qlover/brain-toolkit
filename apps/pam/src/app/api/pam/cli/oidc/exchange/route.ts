import { API_PAM_CLI_OIDC_EXCHANGE } from '@config/route';
import { PamCliController } from '@server/controllers/PamCliController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

/**
 * POST /api/pam/cli/oidc/exchange — GitHub Actions id_token → 15m pam_cli。
 */
export function POST(req: NextRequest) {
  return new NextApiServer(API_PAM_CLI_OIDC_EXCHANGE, req).runWithJson(
    async ({ parameters: { IOC } }) => {
      return IOC(PamCliController).exchangeOidc(req);
    }
  );
}
