import { API_PAM_CATEGORIES } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/pam/categories:
 *   get:
 *     summary: 获取项目分类列表
 *     description: |
 *       返回当前可见项目中已使用的去重分类（公开项目 + 当前用户私有项目）。
 *       不含硬编码预设；库中无数据时返回空数组。
 *     tags:
 *       - PAM
 *     responses:
 *       '200':
 *         description: 分类字符串数组
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["前端", "后端", "工具"]
 */
export function GET(req: NextRequest) {
  return new NextApiServer(API_PAM_CATEGORIES, req).runWithJson(
    ({ parameters: { IOC } }) => IOC(PAMController).listCategories()
  );
}
