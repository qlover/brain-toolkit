import { permissionUid } from '@shared/auth/permissionUid';
import { API_PAM_TRANSFER } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

/**
 * POST /api/pam/transfer/:id — transfer project ownership (admin+).
 *
 * Body: `{ email?: string, user_id?: string }` (at least one required).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return new NextApiServer(API_PAM_TRANSFER, req)
    .use(
      new RequirePermissionPlugin(permissionUid('POST', API_PAM_TRANSFER), {
        projectId: id
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).transferProject(id, req)
    );
}
