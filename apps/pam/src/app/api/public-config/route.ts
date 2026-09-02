import { NextResponse, type NextRequest } from 'next/server';
import { SiteSettingsController } from '@server/controllers/SiteSettingsController';
import { NextApiServer } from '@server/NextApiServer';

const API_PUBLIC_CONFIG = '/api/public-config' as const;

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const result = await new NextApiServer(API_PUBLIC_CONFIG, req).run(
    async ({ parameters: { IOC } }) =>
      IOC(SiteSettingsController).getPublicConfig()
  );

  if (!result.success) {
    return NextResponse.json({
      auth: {
        phoneLoginEnabled: false,
        googleOauthEnabled: false,
        brainPkceEnabled: false,
        brainSupabaseEnabled: false
      }
    });
  }

  const response = NextResponse.json(result.data);
  response.headers.set('Cache-Control', 's-maxage=60');
  return response;
}
