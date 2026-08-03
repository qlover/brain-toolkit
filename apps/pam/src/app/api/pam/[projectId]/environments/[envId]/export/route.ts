import { RequestLogsRepository } from '@qlover/next-kit/server';
import { API_PAM_ENVIRONMENTS_EXPORT } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { PamCliAuthPlugin } from '@server/plugins/PamCliAuthPlugin';
import type { NextRequest } from 'next/server';

type ExportRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * GET /api/pam/:projectId/environments/:envId/export
 * Owner-only decrypted dotenv export (CLI Bearer required).
 */
export function GET(req: NextRequest, context: ExportRouteContext) {
  return new NextApiServer(API_PAM_ENVIRONMENTS_EXPORT, req)
    .use(new PamCliAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId, envId } = await context.params;
      const result = await IOC(PAMController).exportEnvironment(
        projectId,
        envId
      );

      try {
        await IOC(RequestLogsRepository).insertWithAuth({
          event_type: 'pam.cli.export',
          auth_provider: 'pam-cli',
          userAgent: req.headers.get('user-agent'),
          ipAddress:
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
          login_method: 'cli-export'
        });
      } catch {
        // Audit must not block a successful export.
      }

      return result;
    });
}
