import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_EDIT } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return new NextApiServer(API_PAM_EDIT, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_project_edit, {
        projectId: id
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).updateProject(id, req)
    );
}
