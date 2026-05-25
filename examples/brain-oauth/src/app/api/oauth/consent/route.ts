import { OAuthConsentController } from '@server/controllers/OAuthConsentController';
import { NextApiServer } from '@server/NextApiServer';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth consent submission: allow or deny authorization for a registered client.
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

  const server = new NextApiServer('/api/oauth/consent', req);
  const result = await server.run(async ({ parameters: { IOC } }) =>
    IOC(OAuthConsentController).submitConsent(requestBody)
  );

  if (!result.success) {
    const status = result.id === 'access_denied' ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({
    success: true,
    data: result.data
  });
}
