import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import { OAuthClientsController } from '@server/controllers/OAuthClientsController';
import { OAuthClientUpdateSchema } from '@schemas/oauth/OAuthAuthorizeSchema';

/**
 * @swagger
 * /api/clients/{clientId}:
 *   get:
 *     tags:
 *       - OAuth Clients
 *     summary: Get OAuth client details
 *     description: Returns detailed information about a specific OAuth client
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth client details
 *       404:
 *         description: Client not found
 *       401:
 *         description: Not authenticated
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  return await new NextApiServer('/api/clients/[clientId]', req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const controller = IOC(OAuthClientsController);
      return controller.get(params.clientId);
    });
}

/**
 * @swagger
 * /api/clients/{clientId}:
 *   put:
 *     tags:
 *       - OAuth Clients
 *     summary: Update OAuth client
 *     description: Updates an existing OAuth client application
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_name
 *               - redirect_uris
 *             properties:
 *               client_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               client_uri:
 *                 type: string
 *                 format: uri
 *               redirect_uris:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Updated OAuth client details
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Client not found
 *       401:
 *         description: Not authenticated
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  return await new NextApiServer('/api/clients/[clientId]', req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const body = await req.json();
      const validated = OAuthClientUpdateSchema.parse(body);
      const controller = IOC(OAuthClientsController);
      return controller.update(params.clientId, validated);
    });
}

/**
 * @swagger
 * /api/clients/{clientId}:
 *   delete:
 *     tags:
 *       - OAuth Clients
 *     summary: Delete OAuth client
 *     description: Permanently deletes an OAuth client application
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Client deleted successfully
 *       404:
 *         description: Client not found
 *       401:
 *         description: Not authenticated
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  return await new NextApiServer('/api/clients/[clientId]', req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const controller = IOC(OAuthClientsController);
      await controller.remove(params.clientId);
      return NextResponse.json(null, { status: 204 });
    });
}
