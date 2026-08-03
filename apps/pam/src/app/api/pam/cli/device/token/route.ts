import { NextResponse, type NextRequest } from 'next/server';
import { API_PAM_CLI_DEVICE_TOKEN } from '@config/route';
import { PamCliController } from '@server/controllers/PamCliController';
import { NextApiServer } from '@server/NextApiServer';

/**
 * POST /api/pam/cli/device/token — CLI polls for approved device login.
 */
export async function POST(req: NextRequest) {
  const server = new NextApiServer(API_PAM_CLI_DEVICE_TOKEN, req);
  const result = await server.run(async ({ parameters: { IOC } }) =>
    IOC(PamCliController).pollDeviceToken(req)
  );

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
