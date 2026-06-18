import { API_PAM_DETAIL } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/pam/detail/{id}:
 *   get:
 *     summary: 获取 PAM 项目详情
 *     description: 根据项目 ID 返回项目信息，可选择是否附带环境列表及其变量。
 *     tags:
 *       - PAM
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 项目 UUID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "18261d15-9a45-4bb2-8acc-b43a57df25c4"
 *       - name: isEnv
 *         in: query
 *         required: false
 *         description: 是否返回环境信息（1 返回，0 或省略则不返回）
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *           example: 1
 *     responses:
 *       '200':
 *         description: 成功获取项目详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   $ref: '#/components/schemas/PAMProjectDetail'
 *                 message:
 *                   type: string
 *                   example: "success"
 *       '400':
 *         description: 参数错误（如 ID 格式无效）
 *       '404':
 *         description: 项目不存在或无权限访问
 *       '500':
 *         description: 服务器内部错误
 *
 * components:
 *   schemas:
 *     PAMProjectDetail:
 *       type: object
 *       required:
 *         - id
 *         - slug
 *         - name
 *         - is_public
 *         - owner_id
 *         - created_at
 *         - updated_at
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         slug:
 *           type: string
 *           example: "backend-benchmark"
 *         name:
 *           type: string
 *           example: "Brain Backend"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "核心后端API及性能基准"
 *         stack:
 *           type: string
 *           nullable: true
 *           example: "Go, Prometheus"
 *         repo_url:
 *           type: string
 *           nullable: true
 *           format: uri
 *           example: "https://github.com/brain/backend"
 *         category:
 *           type: string
 *           nullable: true
 *           example: "后端"
 *         is_public:
 *           type: integer
 *           enum: [0, 1]
 *           description: "0-私有，1-公开"
 *         owner_id:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         environments:
 *           type: array
 *           description: "仅在 isEnv=1 时返回"
 *           items:
 *             $ref: '#/components/schemas/PAMEnvironment'
 *     PAMEnvironment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "dev"
 *         url:
 *           type: string
 *           nullable: true
 *           format: uri
 *           example: "https://dev-backend.brain.ai"
 *         variables:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           example: { "LOG_LEVEL": "debug", "RATE_LIMIT": "1000" }
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 * @component
 * components:
 * schemas:
 *   PAMProjectItem:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         format: uuid
 *       slug:
 *         type: string
 *       name:
 *         type: string
 *       description:
 *         type: string
 *         nullable: true
 *       stack:
 *         type: string
 *         nullable: true
 *       repo_url:
 *         type: string
 *         format: uri
 *         nullable: true
 *       category:
 *         type: string
 *         nullable: true
 *       is_public:
 *         type: integer
 *         enum: [0, 1]
 *       owner_id:
 *         type: string
 *         format: uuid
 *       created_at:
 *         type: string
 *         format: date-time
 *       updated_at:
 *         type: string
 *         format: date-time
 *       environments:
 *         type: array
 *         items:
 *           $ref: '#/components/schemas/PAMEnvironment'
 * *   PAMSearchResult:
 *     type: object
 *     required:
 *       - items
 *       - total
 *       - page
 *       - pageSize
 *       - hasMore
 *     properties:
 *       items:
 *         type: array
 *         description: 当前页项目列表（已过滤权限）
 *         items:
 *           $ref: '#/components/schemas/PAMProjectItem'
 *       total:
 *         type: integer
 *         description: 符合条件的总记录数（无分页限制）
 *         example: 42
 *       page:
 *         type: integer
 *         description: 当前页码
 *         example: 2
 *       pageSize:
 *         type: integer
 *         description: 每页大小
 *         example: 10
 *       hasMore:
 *         type: boolean
 *         description: 是否还有下一页
 *         example: true
 *       nextCursor:
 *         type: string
 *         nullable: true
 *         description: 游标分页的下一页游标（若支持）
 *       prevCursor:
 *         type: string
 *         nullable: true
 *         description: 游标分页的上一页游标（若支持）
 */
export function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return new NextApiServer(API_PAM_DETAIL, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).getPamDetail((await params).id, req)
    );
}
