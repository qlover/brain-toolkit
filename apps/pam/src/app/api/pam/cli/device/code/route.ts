import { API_PAM_CLI_DEVICE_CODE } from '@config/route';
import { PamCliController } from '@server/controllers/PamCliController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

/**
 * POST /api/pam/cli/device/code — start browser device authorization.
 */
export function POST(req: NextRequest) {
  return new NextApiServer(API_PAM_CLI_DEVICE_CODE, req).runWithJson(
    async ({ parameters: { IOC } }) => {
      return IOC(PamCliController).createDeviceCode(req);
    }
  );
}
