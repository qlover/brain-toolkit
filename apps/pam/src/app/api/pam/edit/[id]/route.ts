import { API_PAM_EDIT } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

export function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return new NextApiServer(API_PAM_EDIT, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).updateProject((await params).id, req)
    );
}
