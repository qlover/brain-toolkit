import { NextResponse, type NextRequest } from 'next/server';
import { API_BRAIN_VERIFY } from '@config/apiRoutes';
import {
  API_OAUTH_BRAIN_AUTH_FAILED,
  API_OAUTH_INVALID_REQUEST
} from '@config/i18n-identifier/api';
import { BrainAuthController } from '@server/controllers/BrainAuthController';
import { NextApiServer } from '@server/NextApiServer';

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
      {
        success: false,
        id: API_OAUTH_INVALID_REQUEST,
        message: 'Invalid JSON'
      },
      { status: 400 }
    );
  }

  const server = new NextApiServer(API_BRAIN_VERIFY, req);
  const result = await server.run(async ({ parameters: { IOC } }) =>
    IOC(BrainAuthController).verifyBrainLogin(requestBody)
  );

  if (!result.success) {
    const status = result.id === API_OAUTH_BRAIN_AUTH_FAILED ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
