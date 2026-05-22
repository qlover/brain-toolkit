import { ExecutorError } from '@qlover/fe-corekit';
import { BrainAuthController } from '@server/controllers/BrainAuthController';
import { NextApiServer } from '@server/NextApiServer';
import { LoginValidator } from '@shared/validators/LoginValidator';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Brain email/password login for OAuth middleware session.
 * Sets HttpOnly `brain_oauth_session` cookie and stores encrypted credentials.
 */
export async function POST(req: NextRequest) {
  let requestBody: unknown;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, id: 'invalid_request', message: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const server = new NextApiServer('api/brain/verify', req);
  const result = await server.run(async ({ parameters: { IOC } }) => {
    const body = await IOC(LoginValidator).getThrow(requestBody);
    try {
      return await IOC(BrainAuthController).verifyBrainLogin(
        body.email,
        body.password
      );
    } catch (err) {
      throw new ExecutorError(
        'brain_auth_failed',
        err instanceof Error ? err.message : 'Brain login failed'
      );
    }
  });

  if (!result.success) {
    const status = result.id === 'brain_auth_failed' ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
