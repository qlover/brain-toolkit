import { permissionUid } from '@shared/auth/permissionUid';
import { API_PAM_DELETE } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return new NextApiServer(API_PAM_DELETE, req)
    .use(
      new RequirePermissionPlugin(permissionUid('POST', API_PAM_DELETE), {
        projectId: id
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).deleteProject(id)
    );
}
