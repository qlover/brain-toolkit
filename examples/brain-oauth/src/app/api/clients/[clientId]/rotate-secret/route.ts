import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import { OAuthClientsController } from '@server/controllers/OAuthClientsController';

/**
 * @swagger
 * /api/clients/{clientId}/rotate-secret:
 *   post:
 *     tags:
 *       - OAuth Clients
 *     summary: Rotate OAuth client secret
 *     description: Generates a new client secret and invalidates the old one
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: New client secret (shown only once)
 *       404:
 *         description: Client not found
 *       401:
 *         description: Not authenticated
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  return await new NextApiServer('/api/clients/[clientId]/rotate-secret', req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const controller = IOC(OAuthClientsController);
      return controller.rotateSecret(params.clientId);
    });
}
