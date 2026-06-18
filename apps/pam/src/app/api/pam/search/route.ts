import { API_PAM_SEARCH } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';
/**
 * @swagger
 * /api/pam/search:
 *   get:
 *     summary: 搜索 PAM 项目列表
 *     description: 支持分页、排序、关键词搜索、结构化过滤及游标分页，返回符合条件的项目列表。
 *     tags:
 *       - PAM
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: 页码（从 1 开始），与 offset 互斥，优先使用 page。
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 2
 *       - name: pageSize
 *         in: query
 *         required: false
 *         description: 每页记录数（最大 100）。
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 10
 *       - name: offset
 *         in: query
 *         required: false
 *         description: 跳过前 N 条记录（与 page 互斥，优先级低于 page）。
 *         schema:
 *           type: integer
 *           minimum: 0
 *           example: 40
 *       - name: cursor
 *         in: query
 *         required: false
 *         description: 游标分页（用于无限滚动），由上次返回的 nextCursor 提供。
 *         schema:
 *           type: string
 *           example: "eyJpZCI6ICJhYmMiLCAiY3JlYXRlZF9hdCI6ICIyMDI2LTAxLTAxIn0="
 *       - name: keyword
 *         in: query
 *         required: false
 *         description: 全局关键词搜索（名称、描述、技术栈等）。
 *         schema:
 *           type: string
 *           example: "brain backend"
 *       - name: filters
 *         in: query
 *         required: false
 *         description: |
 *           结构化过滤条件（JSON 对象字符串）。
 *           支持字段：category, is_public, owner_id 等。
 *         schema:
 *           type: string
 *           example: '{"category":"后端","is_public":1}'
 *       - name: sort
 *         in: query
 *         required: false
 *         description: |
 *           排序规则（JSON 数组字符串），每个元素包含 orderBy 和 order。
 *           若未提供，则默认按 created_at 降序。
 *         schema:
 *           type: string
 *           example: '[{"orderBy":"name","order":"asc"},{"orderBy":"created_at","order":"desc"}]'
 *       # 以下为简化排序的快捷参数（与 sort 互斥，但优先使用 sort）
 *       - name: orderBy
 *         in: query
 *         required: false
 *         description: 排序字段（仅在未提供 sort 时生效）。
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, name, owner_id, is_public]
 *           default: created_at
 *       - name: order
 *         in: query
 *         required: false
 *         description: 排序方向（仅在未提供 sort 时生效）。
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       '200':
 *         description: 成功获取项目列表（含分页元数据）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PAMSearchResult'
 *       '400':
 *         description: 参数错误（如 filters JSON 格式无效、排序字段非法等）
 *       '500':
 *         description: 服务器内部错误
 */

export function GET(req: NextRequest) {
  return new NextApiServer(API_PAM_SEARCH, req).runWithJson(
    ({ parameters: { IOC } }) => IOC(PAMController).searchPamList(req)
  );
}
