import { PAM_FEEDBACK_SCREENSHOT_MAX_COUNT } from '@schemas/PamUserFeedbackSchema';
import { PamUserFeedbackController } from '@server/controllers/PamUserFeedbackController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { PamFeedbackScreenshotUploadType } from '@server/services/PamUserFeedbackService';
import type { NextRequest } from 'next/server';

/**
 * 为已创建反馈追加截图：POST multipart `screenshots`。
 */
export async function POST(
  req: NextRequest,
  context: { readonly params: Promise<{ readonly id: string }> }
) {
  const { id } = await context.params;
  const path = `/api/user/feedback/${id}/screenshots`;
  return await new NextApiServer(path, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const form = await req.formData();
      const files: PamFeedbackScreenshotUploadType[] = [];
      const entries = form.getAll('screenshots');
      for (const entry of entries.slice(0, PAM_FEEDBACK_SCREENSHOT_MAX_COUNT)) {
        if (typeof entry === 'string') {
          continue;
        }
        const blob = entry as File;
        const buffer = Buffer.from(await blob.arrayBuffer());
        files.push({
          bytes: buffer,
          contentType: blob.type || 'image/jpeg',
          fileName: blob.name || 'screenshot.jpg'
        });
      }
      return IOC(PamUserFeedbackController).attachScreenshots(id, files);
    });
}
