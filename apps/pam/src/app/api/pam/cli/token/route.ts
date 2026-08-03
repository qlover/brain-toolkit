import { API_PAM_CLI_TOKEN } from '@config/route';
import { PamCliController } from '@server/controllers/PamCliController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

/**
 * POST /api/pam/cli/token — exchange email/password for a CLI bearer token.
 */
export function POST(req: NextRequest) {
  return new NextApiServer(API_PAM_CLI_TOKEN, req).runWithJson(
    async ({ parameters: { IOC } }) => {
      return IOC(PamCliController).createToken(req);
    }
  );
}
