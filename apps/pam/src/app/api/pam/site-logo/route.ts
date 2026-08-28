import { API_PAM_SITE_LOGO } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

/**
 * GET /api/pam/site-logo?url=https://example.com — proxy site favicon/logo.
 */
export function GET(req: NextRequest) {
  return new NextApiServer(API_PAM_SITE_LOGO, req).runWithBinary(
    ({ parameters: { IOC } }) => IOC(PAMController).getSiteLogo(req)
  );
}
