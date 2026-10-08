import type { BrainLoginEnvs } from '@config/brainApi';
import { API_BRAIN_ENVS } from '@config/route';
import { NextApiServer } from '@server/NextApiServer';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/brain/envs:
 *   get:
 *     tags:
 *       - User
 *     summary: Brain environments selectable on the login page
 *     responses:
 *       200:
 *         description: Success envelope; `data` is `{ envs: string[], defaultEnv: string }`.
 */
export async function GET(req: NextRequest) {
  return await new NextApiServer(API_BRAIN_ENVS, req).runWithJson(
    async ({ parameters: { IOC } }): Promise<BrainLoginEnvs> => {
      const { config } = await IOC(SiteSettingsService).getBrainApiTarget();
      return { envs: Object.keys(config.domains), defaultEnv: config.env };
    },
    {
      successHeaders: {
        'Cache-Control': 'public, max-age=30'
      }
    }
  );
}
