import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_MEMORY_KV } from '@config/apiRoutes';
import { AdminMemoryKvController } from '@server/controllers/AdminMemoryKvController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_MEMORY_KV, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_memory_kv_read))
    .runWithJson(async ({ parameters: { IOC } }) => {
      const url = new URL(req.url);
      return IOC(AdminMemoryKvController).list({
        prefix: url.searchParams.get('prefix')
      });
    });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return await new NextApiServer(API_ADMIN_MEMORY_KV, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_memory_kv_write))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminMemoryKvController).purge(body)
    );
}
