# pam

## 2.6.0

### Minor Changes

#### ✨ Features

- **pam:** 列表可见性筛选与 request log 审计白名单 ([4773555](https://github.com/qlover/brain-toolkit/commit/47735553a53eb4f625a05a13a826e2ba11ea3dc3)) ([#121](https://github.com/qlover/brain-toolkit/pull/121))

  工具栏支持全部/公开/私有筛选；审计改为 allowlist 仅记录变更类 API，并补单测。

- **pam:** 删除项目移至通用设置危险区 ([014ea86](https://github.com/qlover/brain-toolkit/commit/014ea86862a4c117d1b514c88c56bc4715921a21)) ([#120](https://github.com/qlover/brain-toolkit/pull/120))

  详情页顶栏去掉删除按钮，改到 General 危险区域；确认框默认文案走 i18n；升级 next-kit 至 ^1.1.0。

- **pam,brain-oauth:** create/update 支持 logo_uri 落库 ([ba126b4](https://github.com/qlover/brain-toolkit/commit/ba126b458bb7a6a2f06cce66fee3fb1e1632e610)) ([#118](https://github.com/qlover/brain-toolkit/pull/118))

  本地扩展 Create/Update schema，Repo insert/update 写入 logo_uri（空串存 null）。

- **pam,brain-oauth:** developer apps 补齐 logo 预览与列表展示 ([c57a9dd](https://github.com/qlover/brain-toolkit/commit/c57a9dd76642c7ab61dfb055f79a4b02f883465e)) ([#118](https://github.com/qlover/brain-toolkit/pull/118))

  表单增加 logo URL 与预览；列表展示头像与可点击 client_uri，并补充 i18n。

- **pam:** 新增项目分类 API 与 ISR 拉取 ([64ad2fc](https://github.com/qlover/brain-toolkit/commit/64ad2fc032573da5ce64a9abb3ee52f8f5d03cee)) ([#117](https://github.com/qlover/brain-toolkit/pull/117))

  Repo/Service 提供去重分类；公开分类走 unstable_cache，并暴露 GET /api/pam/categories。

- **pam:** 分类改为 API 建议列表并支持自由输入 ([2241750](https://github.com/qlover/brain-toolkit/commit/22417501ef7f8254f342d977ea8d4da1591aeed3)) ([#117](https://github.com/qlover/brain-toolkit/pull/117))

  去掉硬编码预设；列表 ISR 注入分类，表单/筛选使用动态选项与自定义输入。

#### 🐞 Bug Fixes

- **pam,brain-oauth:** 修复 rotate-secret URL 拼错导致 405 ([ef87e65](https://github.com/qlover/brain-toolkit/commit/ef87e65976403981978830408066cb0be7e8c071)) ([#118](https://github.com/qlover/brain-toolkit/pull/118))

  apiClientRotateSecret 改为基于 API_CLIENTS_ROTATE_SECRET 生成路径，避免 POST 打到 detail 路由。

- **pam,brain-oauth:** 优化 developer apps 弹窗交互并修校验 ([1ebc86e](https://github.com/qlover/brain-toolkit/commit/1ebc86e983b72995cc89fb8014270c7dccdb435b)) ([#118](https://github.com/qlover/brain-toolkit/pull/118))

  编辑弹窗改为可滚动 sheet 与单行底栏；修正空 redirect URI 校验文案、详情加载竞态与 logo 破损态。

#### 🚀 Performance

- **pam:** 加速首页会话与分类接口，并加内存 KV 缓存 ([e6dc66d](https://github.com/qlover/brain-toolkit/commit/e6dc66d0cbc41479d7ef6531d9f14997eb0dd3ab)) ([#119](https://github.com/qlover/brain-toolkit/pull/119))

  session 改为 cookie 只读；分类走轻量查询 + TTL 缓存；热路径跳过 request log；复用 admin Supabase 客户端；AuthButton 避免 hydration 闪烁。

## 2.5.0

### Minor Changes

#### ✨ Features

- **pam:** 列表搜索分类筛选与移动端工具栏收紧 ([61a06e3](https://github.com/qlover/brain-toolkit/commit/61a06e390c8b0d07e111c8931ee6701a2b3d8b2d)) ([#115](https://github.com/qlover/brain-toolkit/pull/115))

  支持预设/自定义分类过滤、关键词高亮与搜索反馈；
  移动端隐藏标题文案、分类横滑，新增改为 FAB。

- **pamenv,pam:** 本地 CLI 隔离、API 错误 i18n 与 create_source ([3b93564](https://github.com/qlover/brain-toolkit/commit/3b93564206632da970426a37704642640b59f8f0)) ([#114](https://github.com/qlover/brain-toolkit/pull/114))

  支持 pamenv --local/--url/--domain 与 cwd .pam 隔离；结构化 PamCliApiError
  与 locale 缓存；将基础设施错误归一为 api:server\_\_error；CLI 建项走 admin
  客户端规避 RLS；pam_projects.create_source 记录创建来源（0=web，1=cli，2=fork）。

- **pam:** device 登录回传 locale，并完善 CLI locales API ([253a641](https://github.com/qlover/brain-toolkit/commit/253a641626ce395d9d6783a30f9f5735afde06dc)) ([#114](https://github.com/qlover/brain-toolkit/pull/114))

  浏览器 approve 带上当前页面语言，poll token 回传给 CLI；locales/json 在静态模式下正确返回 api 命名空间。

- **pam:** 增加 Brain PKCE 登录并暂时禁用 custom:brain ([73b4360](https://github.com/qlover/brain-toolkit/commit/73b4360346a0148ff1c1b6f748b713cab2d896c6)) ([#113](https://github.com/qlover/brain-toolkit/pull/113))

  本地 brain-oauth 无法被云端 Supabase 回调时，用授权码+PKCE 直连建会话.

- **pam:** 登录页 Brain 按钮文案、图标与禁用提示 ([a4b7596](https://github.com/qlover/brain-toolkit/commit/a4b75965e05d0bd1a47cdaf97d79167c5f19cff5)) ([#113](https://github.com/qlover/brain-toolkit/pull/113))

  对齐 GitHub 文案风格，补充 Brain/PKCE/Google/手机禁用说明，并使用 brain-oauth logo。

- **pam:** 非本地环境禁用 Brain PKCE 登录 ([5135cb6](https://github.com/qlover/brain-toolkit/commit/5135cb6f682b4be22e18f01a8d81926e87811cad)) ([#113](https://github.com/qlover/brain-toolkit/pull/113))

  线上暂无跨域请求 Brain API 方案，仅 APP_ENV=localhost 可用。

#### 🐞 Bug Fixes

- **pam:** 修复 Brain PKCE 回调会话与 cookie 写入 ([1ec94ea](https://github.com/qlover/brain-toolkit/commit/1ec94eaa073ba745168bd2fbd008b34d1c578bcd)) ([#113](https://github.com/qlover/brain-toolkit/pull/113))

  回调在 redirect 响应上设置 pam_session，并避免过大 token 导致 cookie 被丢弃。

- **pam:** 修复 Pages 退出跳转与主题 hydration ([8eced4f](https://github.com/qlover/brain-toolkit/commit/8eced4f2d46253caeb3e6aa38a2541c6d1da9307)) ([#113](https://github.com/qlover/brain-toolkit/pull/113))

  挂载 AppBridgePages，并用 ClientThemeProvider + timeZone 避免 Pages 控制台闪烁和退出失败。

## 2.4.0

### Minor Changes

#### ✨ Features

- **pam:** 拆分 / 落地页与公开 /projects 列表 ([d026c5f](https://github.com/qlover/brain-toolkit/commit/d026c5f3d3f9d37db93f85012fc9c05a7c366339)) ([#111](https://github.com/qlover/brain-toolkit/pull/111))

  将项目列表迁到 /projects，首页改为介绍落地（示意、用法、CLI、公开项目预览），详情返回指向列表。

- **pam:** 落地页增加版本与版权 footer ([a855340](https://github.com/qlover/brain-toolkit/commit/a8553402be54d9a6a917919276119f646ff7b8ac)) ([#111](https://github.com/qlover/brain-toolkit/pull/111))

- **pam:** 详情改用 slug，并支持删除与 CLI 环境管理 ([f768065](https://github.com/qlover/brain-toolkit/commit/f7680651b7333766bc8f4b79d20403eb36ffe6ca)) ([#110](https://github.com/qlover/brain-toolkit/pull/110))

  详情 URL 使用 slug（UUID 仍兼容跳转）；owner 可删除项目；fork 仅限他人公开项目。create/delete environment 走 admin 客户端，避免 CLI bearer 无 Supabase RLS session。

- **pamenv:** 新增 remove，push 延后创建缺失环境 ([ec49038](https://github.com/qlover/brain-toolkit/commit/ec490389cc6a37d57ac1a36f6f4eac64f2bf0e67)) ([#110](https://github.com/qlover/brain-toolkit/pull/110))

  缺失 -e 环境时先完成校验与确认，再一并创建并写入变量；新增 remove 两次确认删除；void 成功响应不再误报失败；补充 defaultEnvUrl 与文档。

#### 🐞 Bug Fixes

- **pam:** 鉴权就绪后再 ensure 首页项目列表 ([e4a11da](https://github.com/qlover/brain-toolkit/commit/e4a11da3250032394ecf1195af574820b20631d8)) ([#111](https://github.com/qlover/brain-toolkit/pull/111))

  避免游客先拉再登录重拉，以及从详情返回时重复拉取。

- **pam:** 允许非敏感环境变量为空字符串 ([57bd9a0](https://github.com/qlover/brain-toolkit/commit/57bd9a0509594e5cf97fd2c89653e2167533935e)) ([#110](https://github.com/qlover/brain-toolkit/pull/110))

  与 dotenv 的 KEY= 语义对齐，避免 pamenv push 因空值被 zod 拒绝。

## 2.3.0

### Minor Changes

#### ✨ Features

- **pam:** 支持 Fork 项目并剥离敏感变量 ([f6fa207](https://github.com/qlover/brain-toolkit/commit/f6fa2070dffdd3900f11a9aa190470389139798e)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  允许登录用户从可读项目派生私有副本，复制环境结构但不复制敏感值。

  Co-authored-by: Cursor <cursoragent@cursor.com>

#### 🐞 Bug Fixes

- **pam:** 移除 fork 测试中无效的 is_deleted 字段 ([d2e0c88](https://github.com/qlover/brain-toolkit/commit/d2e0c8895265e8b5d4033c51b80029b73706862c)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  PAMProjectDetail 不含 is_deleted，对齐类型以通过 tsc。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 防止环境变量注释过长导致横向滚动 ([6ba47bf](https://github.com/qlover/brain-toolkit/commit/6ba47bf227c95d96f663e7af1d87a40987c250c3)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  长无断注释在导入后撑开布局，限制容器宽度并强制换行。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 软删后释放 slug 供复用 ([b31ce59](https://github.com/qlover/brain-toolkit/commit/b31ce597652b28dd7120f061c4e057f058dc4d03)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  将全表 UNIQUE 改为仅未删除行唯一，并补充迁移脚本。

  Co-authored-by: Cursor <cursoragent@cursor.com>

#### 📝 Documentation

- 补充 pamenv init 与 Web CLI 文档 ([fd387c4](https://github.com/qlover/brain-toolkit/commit/fd387c4ca321c562967ddd2a118c8d231a9007a1)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  说明扫描默认值、环境规则、slug 软删复用及典型流程。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- 补充 pamenv fork 与 Web CLI 文档 ([8f58563](https://github.com/qlover/brain-toolkit/commit/8f585631f0a3ed29e5d0b3312449b5549d9fbd08)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  Co-authored-by: Cursor <cursoragent@cursor.com>

## 2.2.0

### Minor Changes

#### ✨ Features

- **pam:** 新增 pamenv CLI 使用文档页 ([f55f1b5](https://github.com/qlover/brain-toolkit/commit/f55f1b5e71c3f7b747aa2352323f4468a7e2b9b9)) ([#104](https://github.com/qlover/brain-toolkit/pull/104))

#### 📝 Documentation

- **pam:** 更新 CLI 文档页安装包名为 pamenv-cli ([7b3f206](https://github.com/qlover/brain-toolkit/commit/7b3f206e99d76e09ef80743185e3e2b8c90ba5e9)) ([#106](https://github.com/qlover/brain-toolkit/pull/106))

  安装示例改为 pamenv-cli，命令示例仍保持 pamenv。

## 2.1.0

### Minor Changes

#### ✨ Features

- **pam:** 新增 pamenv CLI 使用文档页 ([f55f1b5](https://github.com/qlover/brain-toolkit/commit/f55f1b5e71c3f7b747aa2352323f4468a7e2b9b9)) ([#104](https://github.com/qlover/brain-toolkit/pull/104))

## 2.0.0

### Major Changes

#### ✨ Features

- **pam:** 支持 CLI 鉴权、浏览器授权、环境导出与可吊销 Token ([90d73bc](https://github.com/qlover/brain-toolkit/commit/90d73bc62ca693f133e343cd001a76af098946a7)) ([#102](https://github.com/qlover/brain-toolkit/pull/102))

- **pam:** 环境变量 comments 原样导入展示与草稿导入 ([688a1d3](https://github.com/qlover/brain-toolkit/commit/688a1d3b9807f5f7accc6a725ea2268152e57721)) ([#102](https://github.com/qlover/brain-toolkit/pull/102))

- **pam:** 优化环境变量注释展示 UI ([855171b](https://github.com/qlover/brain-toolkit/commit/855171bf59cb4a9359ac4f2f9fadbd56014b4eda)) ([#102](https://github.com/qlover/brain-toolkit/pull/102))

## 1.0.0

### Major Changes

#### ✨ Features

- **pam:** 敏感变量加密、env 独立 API 与路径参数修复 ([26f0d3f](https://github.com/qlover/brain-toolkit/commit/26f0d3f8c837e38833d08de091ce1dcce8684d5c)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  支持敏感变量脱敏/合并落库加密，补齐环境 CRUD 与变量保存接口，并修复 buildApiWithPath 多参数覆盖问题。

- **pam:** 项目 general/environments 详情页并去掉列表编辑入口 ([85521b9](https://github.com/qlover/brain-toolkit/commit/85521b911ecb0993eb7d24d731cb1c2efbf4734c)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  新增详情壳与分字段保存/环境变量管理页，创建弹窗保留导入能力，列表点击进入 general。

- **pam:** AppApi 接入 AborterPlugin，补充 stop 与 PAMAbortId ([38bad45](https://github.com/qlover/brain-toolkit/commit/38bad458e6f557b2982861940d420e15b816ade7)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  为详情/环境读取接入 abortId，并对并发 searchProjects 做 inflight 去重。

- **pam:** 默认邮箱 OTP 登录并跳转首页 ([1d736d8](https://github.com/qlover/brain-toolkit/commit/1d736d8c7c9798a786ab9bbed1f35fd02883e685)) ([#93](https://github.com/qlover/brain-toolkit/pull/93))

  禁用手机号 Tab 点击，登录成功后统一回首页而非 developer 页面。

- **pam:** 首页预取公开列表并优化列表展示 ([088ef3b](https://github.com/qlover/brain-toolkit/commit/088ef3b23cbfee2487cd22c46bee8dfe64967b14)) ([#93](https://github.com/qlover/brain-toolkit/pull/93))

  通过 RSC/ISR 预取首屏公开项目消除 loading 闪烁，列表标题下方改为显示完整 URL。

#### 🐞 Bug Fixes

- **pam,brain-oauth:** 修复 next-kit 迁移后的类型与构建错误 ([ceb595a](https://github.com/qlover/brain-toolkit/commit/ceb595a495437c886956738be796d132d95c8322)) ([#100](https://github.com/qlover/brain-toolkit/pull/100))

  放开 PAMSupabaseRepo.search 以支持 ilikeOr；transpile next-kit 并统一 corekit-bridge 版本，避免 ESM 目录导入失败。

- **pam,brain-oauth:** 修复 Pages SSG 时 next-intl Context 不一致 ([97cae46](https://github.com/qlover/brain-toolkit/commit/97cae46f938c5e4003e2c47b588a7b7b64425d89)) ([#100](https://github.com/qlover/brain-toolkit/pull/100))

  i18n hook 改回 app 内调用 next-intl，只复用 kit 的 TranslateI18nUtil，避免预渲染 /about 等页时空 Error。

- **pam:** 语言切换时保留动态路由 params ([4eea15d](https://github.com/qlover/brain-toolkit/commit/4eea15d98d227e2a7d0554829b2b62f0c62b2d0f)) ([#99](https://github.com/qlover/brain-toolkit/pull/99))

  next-intl 的 usePathname 返回模板路径，切换语言时一并传入
  useParams，避免地址变成 /projects/[projectId]/general。

- **pam:** 非 owner 详情只读，并去掉 API 错误二次 toast ([620e83a](https://github.com/qlover/brain-toolkit/commit/620e83a6e29eff30c130b49836a2a0fa1d4ce6c2)) ([#98](https://github.com/qlover/brain-toolkit/pull/98))

  详情接口返回 is_owner；General/Environments 按 canEdit 禁用编辑；
  业务 catch 不再重复弹 DialogErrorPlugin 已处理的错误。

- **pam:** 加固 useStrictEffect 以兼容 Strict Mode 二次挂载 ([ebfb6ee](https://github.com/qlover/brain-toolkit/commit/ebfb6ee62ed0601e4982968993d2a6a6f2fe3d31)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

- **pam:** 忽略 AbortError，避免取消请求弹 toast 或刷错误日志 ([a193c83](https://github.com/qlover/brain-toolkit/commit/a193c83ccb06cfd6f1e5d91797cda1ad95d09bf4)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  Strict Mode 重挂与页面切换触发的取消视为预期行为。

- **pam,brain-oauth:** 中间件进页门禁并修复 Pages 主题闪烁 ([a5bdd08](https://github.com/qlover/brain-toolkit/commit/a5bdd08b95389b00abe5e6766e052b2a1b1bae0a)) ([#96](https://github.com/qlover/brain-toolkit/pull/96))

  以 LOGINED_PAGES 为唯一进页鉴权，去掉 WithUserAuth 全屏门；Pages 补 favicon 与主题初始化脚本，主题菜单按偏好选中并同步 brain-oauth。

- **pam,brain-oauth:** ThemeSwitcher 使用 SupportedTheme 泛型 ([b1d3029](https://github.com/qlover/brain-toolkit/commit/b1d3029e15a7b0f473db17ae498d9a57565a8199)) ([#96](https://github.com/qlover/brain-toolkit/pull/96))

  useTheme 默认不含 pink，导致 setTheme 类型报错。

- **pam:** 将 Next OAuth 模板文案替换为 PAM 品牌 ([2f31e57](https://github.com/qlover/brain-toolkit/commit/2f31e57db54bc83a2804125283c9c47602b769af)) ([#96](https://github.com/qlover/brain-toolkit/pull/96))

  更新首页/文档/授权/Playground 等 i18n 标识、manifest 名称与登出日志 auth_provider。

- **pam:** 避免裸 hidden 类被浏览器扩展覆盖显示 ([e30e743](https://github.com/qlover/brain-toolkit/commit/e30e74364f028dcb510a8aeb9be90d26a6bc0e85)) ([#95](https://github.com/qlover/brain-toolkit/pull/95))

  将 hidden + 响应式显示改为 max-\*:hidden，条件显隐改用 HTML hidden，避免 DeepL 等扩展注入的 .hidden 压过 Tailwind utilities。

- **pam,brain-oauth:** 恢复误改样式并同步去掉裸 hidden ([cc20228](https://github.com/qlover/brain-toolkit/commit/cc20228ab5b593c0596e87e11364cbcce25ecb08)) ([#95](https://github.com/qlover/brain-toolkit/pull/95))

  还原登录表单 max-w-[420px] 与 PAMForm 圆角；brain-oauth 仅替换 hidden 写法。

- **pam:** OAuth token/userinfo/revoke 返回扁平 RFC JSON ([02855a3](https://github.com/qlover/brain-toolkit/commit/02855a3307c165bf3b1562a2784f9a9e5ee811e9)) ([#94](https://github.com/qlover/brain-toolkit/pull/94))

  兼容 Supabase 等标准 OAuth 客户端，不再使用 { success, data } 信封。

- **web:** 更新 OAuth 授权流程以强制登录 ([7c991fa](https://github.com/qlover/brain-toolkit/commit/7c991fa7790c4d8d485a8abda3abe8c2afa96df7)) ([#94](https://github.com/qlover/brain-toolkit/pull/94))

  将 `ROUTE_OAUTH_AUTHORIZE` 添加至 `LOGINED_PAGES`，确保未登录用户访问授权页时自动重定向至登录页面，并在登录后返回授权页

- **pam:** 修复 OAuth token 被加 locale 及 refresh token 存储错误 ([773edfc](https://github.com/qlover/brain-toolkit/commit/773edfce0106a032c908669c3313680686f47e76)) ([#93](https://github.com/qlover/brain-toolkit/pull/93))

  跳过 /oauth/token 等机器端点的 i18n 重写，并将 provider_session_token 改为存储 Supabase refresh token，避免 PKCE 换票 invalid_grant。

#### ♻️ Refactors

- **pam:** 迁移至 @qlover/next-kit 并清理无用代码 ([1b0f5a4](https://github.com/qlover/brain-toolkit/commit/1b0f5a4075edc2ced794831cfbd2b1076e6d7b7b)) ([#100](https://github.com/qlover/brain-toolkit/pull/100))

  将 schema、校验器、仓储、通用 UI/工具改为复用 next-kit，并移除未使用的演示与残留实现。

- **brain-oauth:** 迁移至 @qlover/next-kit 并清理无用代码 ([f55d54c](https://github.com/qlover/brain-toolkit/commit/f55d54c310fd2dc3534ad767c7e0d103b3f5c485)) ([#100](https://github.com/qlover/brain-toolkit/pull/100))

  与 pam 对齐复用 next-kit，删除应用内重复模块及未接线的死代码。

- **pam:** 列表进详情改为 next-intl Link ([154ab48](https://github.com/qlover/brain-toolkit/commit/154ab48656494511b3dc7fdf56e2ae9b484c4ead)) ([#99](https://github.com/qlover/brain-toolkit/pull/99))

  用带 locale 的 Link 替换 button + onOpen，悬停/新开页都能保留语言前缀。

- **pam:** 项目详情路径统一为 route.ts 常量 ([f270c51](https://github.com/qlover/brain-toolkit/commit/f270c517cb6b8a3d6207ebec32c709467c71d388)) ([#99](https://github.com/qlover/brain-toolkit/pull/99))

  抽出 ROUTE*PROJECT*\* 模板，供 next-intl pathnames 与 Link/跳转复用。

- **pam:** 按列表/项目壳/general/environments 拆分 i18n ([1cd92d1](https://github.com/qlover/brain-toolkit/commit/1cd92d13076583f33855911fde803179c0ce1fa1)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  将原 page_pam 文案拆到对应页面命名空间，并为共用 env 表单抽离 PAMEnvFormI18n 结构类型。

- **pam:** 详情由 Shell 统一拉取，General 复用 context ([7e20409](https://github.com/qlover/brain-toolkit/commit/7e20409e9747018250588f41ea96209ddfd3d3c8)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  去掉 General 二次 getProjectDetail；列表与环境挂载改用 useStrictEffect + stop。

- **pam:** 同步 next-oauth 邮箱登录 PKCE 流程 ([332f9ff](https://github.com/qlover/brain-toolkit/commit/332f9fffd74843606c21d87c29924995473b8fb7)) ([#93](https://github.com/qlover/brain-toolkit/pull/93))

  将 magic link 从 hash token 改为服务端 PKCE 换 session，并规范化 SITE_URL 与回调页 bootstrap 时机。

## 0.3.0

### Minor Changes

#### ✨ Features

- **pam:** 未登录隐藏新建与编辑删除入口 ([592a82a](https://github.com/qlover/brain-toolkit/commit/592a82ad5d53cc6da3274131a804c093fc2e43ea)) ([#91](https://github.com/qlover/brain-toolkit/pull/91))

  按登录态控制工具栏新建、列表/卡片操作与弹窗，访客不再看到 mutate 按钮。

- **pam:** 登录页改为 PAM 品牌文案并展示版本号 ([1877a4f](https://github.com/qlover/brain-toolkit/commit/1877a4fd0433741e19b1309dea4ad670a0e9e248)) ([#91](https://github.com/qlover/brain-toolkit/pull/91))

  禁用尚未支持的手机登录 Tab，登录成功后回到首页。

## 0.2.0

### Minor Changes

#### ✨ Features

- **pam:** 优化搜索 UX 与多字段命中率 ([6bf773a](https://github.com/qlover/brain-toolkit/commit/6bf773abca5e32dc1289418b7f10415de55efb7e)) ([#88](https://github.com/qlover/brain-toolkit/pull/88))

  将 FTS 改为项目文本字段 ILIKE，缩短防抖并避免搜索闪空；列表同时展示分类与技术栈。

- **pam:** 将列表与卡片 UI 对齐 v3 原型 ([3b657a0](https://github.com/qlover/brain-toolkit/commit/3b657a0446e600ddc15f393bbeb470690aa10308)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  仅私有显示锁、文字操作菜单（分组与删除红色）、环境 chip 原型配色，以及锁与环境入口的响应式尺寸。

- **pam:** 优化列表与卡片布局密度与交互 ([124d07e](https://github.com/qlover/brain-toolkit/commit/124d07ee49dbd39fed60585b7f98eaad55582e4f)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  大屏列表三行排布并加大标题；去掉多余打开仓库/部署入口；userId 可省略复制；卡片收紧空状态与 logo 内边距，并同步 v3 原型。

- **pam:** 对齐新建编辑弹窗表单到 v3 原型 ([d38820d](https://github.com/qlover/brain-toolkit/commit/d38820dae538d147c36fa2653151e0dab7c5d5a1)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  统一 field 样式与可见性切换，操作栏移入 Modal footer，并修正 secondary/elevated 背景层次。

- **pam:** Integrate sonner for toast notifications and enhance dialog handling ([ddc54fc](https://github.com/qlover/brain-toolkit/commit/ddc54fcf9933c18be114110c73e18dfc6e87f808)) ([#84](https://github.com/qlover/brain-toolkit/pull/84))
  - Removed deprecated '@ant-design/icons' in favor of '@heroicons/react' for a more modern icon set.
  - Introduced sonner for toast notifications, replacing Ant Design's message component in DialogHandler.
  - Updated DialogHandler to utilize a React-based confirm dialog through DialogUIHost.
  - Refactored PAM components to support new icon imports and improved user feedback mechanisms.
  - Added new icons for GitHub and Google, enhancing the visual consistency across the application.

- **pam:** Enhance internationalization support and update schema handling ([a70d67b](https://github.com/qlover/brain-toolkit/commit/a70d67b5821c812247e6ef62ad1e21524f6aedb0)) ([#83](https://github.com/qlover/brain-toolkit/pull/83))
  - Added new `@locales/*` path mappings in `tsconfig.json` and `vitest.config.ts` for improved localization management.
  - Introduced `i18nKey.ts` schema for validating i18n keys, including utility functions for key manipulation.
  - Updated `i18nKeyScheam.ts` to utilize the new `I18N_KEY_PATTERN` from `i18nKey.ts`.
  - Refactored `loadMessages.ts` to load locale files using the new path mappings.
  - Added ambient module declarations for locale JSON files in `locales.d.ts` to support TypeScript integration.
  - Updated `DialogErrorPlugin.ts` to use the new i18n key validation method.

- **pam:** Update tailwind theme integration and enhance CSS generation ([cbd45a3](https://github.com/qlover/brain-toolkit/commit/cbd45a3aca944b04f404f25a2c14c2abdcb14981)) ([#83](https://github.com/qlover/brain-toolkit/pull/83))
  - Updated `@qlover/tailwind-theme` dependency to version ^0.3.0 in `package.json`.
  - Refactored CSS imports in `tailwind.css` to use generated theme file.
  - Introduced `generateAppThemeCss` utility to create a slim theme CSS file based on supported themes.
  - Integrated theme CSS generation in `next.config.ts` for both PAM and brain-oauth examples.
  - Added local IP address detection for development environments in `next.config.ts`.
  - Updated `.gitignore` to include generated styles directory and ensure proper file exclusions.

- **pam, brain-oauth:** Upgrade ESLint configuration and dependencies for improved linting ([099fe47](https://github.com/qlover/brain-toolkit/commit/099fe472b3a519c0f9697526f8bd66105182dbbc)) ([#83](https://github.com/qlover/brain-toolkit/pull/83))
  - Updated ESLint and related plugins to version 10.x in `package.json` for both `pam` and `brain-oauth`.
  - Refactored ESLint configuration to utilize `@eslint/js` and `eslint-plugin-import-x`.
  - Enhanced ESLint rules and settings for better code quality and consistency.
  - Integrated new theme provider from `@wrksz/themes` in layout components for improved theming support.
  - Updated README and other documentation to reflect changes in theme integration.

- **pam:** Enhance session management and improve authentication flow ([df43a83](https://github.com/qlover/brain-toolkit/commit/df43a83bd56f0e73802b25200944c9e0e27645d8)) ([#82](https://github.com/qlover/brain-toolkit/pull/82))
  - Added `hasSessionFromRequest` method in `OAuthSessionService` to check for valid sessions from requests.
  - Introduced `GUEST_ONLY_AUTH_PAGES` constant to define routes accessible only to unauthenticated users.
  - Implemented `isAuthGuestOnlyPath` function to redirect authenticated users away from guest-only routes.
  - Updated `proxy` middleware to handle redirection based on session status.
  - Refactored login and register pages to utilize `PageI18nProvider` for improved internationalization support.

- **pam:** Add PAM logo and update layout to include header logo ([fcb1053](https://github.com/qlover/brain-toolkit/commit/fcb1053a9a11eb6682de51b52b876f69477e5f2b)) ([#82](https://github.com/qlover/brain-toolkit/pull/82))

- **apps-pam:** Init PAM project ([9eb7818](https://github.com/qlover/brain-toolkit/commit/9eb78181bd02d4bbded9f172b9156a3f9b874cc0)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

- **pam:** Refactor code structure for improved readability and maintainability ([b59861e](https://github.com/qlover/brain-toolkit/commit/b59861e60bc0a6a1ab2571066e8683454b1ab225)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

- **repo:** implement BaseRepository and SupabaseRepo for enhanced data handling ([601c8c1](https://github.com/qlover/brain-toolkit/commit/601c8c1c643df611c4d7a2e333687562d61758bd)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

- add PAM project and environment management with RLS and search functionality ([638ebc3](https://github.com/qlover/brain-toolkit/commit/638ebc364f6d59769a44e028c75d5e164c9b9204)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - Create SQL schema for pam_projects and pam_environments with necessary indexes and triggers.
  - Implement row-level security policies for project and environment access control.
  - Add sample data insertion script for testing purposes.
  - Develop PAMController to handle project search requests.
  - Introduce PAMService and PAMProjectRepo for project management and search operations.
  - Create validation and schema definitions for project and environment data.
  - Update API routes to include new search endpoint for PAM projects.
  - Enhance localization for home page titles and keywords.

- **repo:** add user_id parameter description to search method for clarity ([32df417](https://github.com/qlover/brain-toolkit/commit/32df41706e10f1105bd957cc311c6e1ba446faaa)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

- **auth:** enhance user session management and update user retrieval methods ([6e258ba](https://github.com/qlover/brain-toolkit/commit/6e258bad3a0b9d1634bb294df3ab318916db460f)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

- **pam:** Enhance project update functionality and API authentication ([72c223c](https://github.com/qlover/brain-toolkit/commit/72c223c210767c569f17699f3c0c9ae2ecbd08c7)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - feat(pam): implement project update functionality with environment handling
  - feat(pam): refactor Supabase client handling and enhance API authentication
  - feat(pam): enhance project update functionality with RPC support and environment management

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** Implement project creation API and related schema updates ([c160fcd](https://github.com/qlover/brain-toolkit/commit/c160fcdde51718cb6a3f2c7fdfdcffde41e1d95a)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** Implement PAM project management and user session enhancements ([8f69654](https://github.com/qlover/brain-toolkit/commit/8f696541f1028bdaf34c77809c8b8e1d9fe6d436)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - feat(pam): Implement PAM search functionality with new API and facade structure
  - fix(pam): Simplify user session refresh logic in SupabaseOAuthProvider
  * Introduced a new `toUserSchema` function to streamline user profile transformation.
  * Updated `refreshUser` and `getUserInfo` methods to utilize the new function for returning user data.
  * Enhanced error handling for missing refresh tokens during session retrieval.
  - feat(pam): Update dependencies and enhance project schema
  * Added `@hookform/resolvers` dependency with version 5.4.0.
  * Updated `@qlover/oauth-wrapper` to version 0.6.2.
  * Introduced `react-hook-form` dependency with version 7.80.0.
  * Modified `PAMProjectSchema` to include `is_deleted` field for soft deletion management.
  * Enhanced user session handling in `UserController` and `OAuthUserService` for improved user data retrieval.
  * Added validation for unique environment names in project schemas.
  - feat(pam): Implement project creation and management features
  * Added a new `ResponsiveModal` component for project creation.
  * Introduced `PAMForm` and `PAMFormEnvironments` components for handling project input and environment variables.
  * Updated `PAMFacade` to include methods for creating projects with environment support.
  * Enhanced `PAMApi` to support project creation API calls.
  * Refactored `PAMProjectCard` and `PAMProjectList` components to utilize the new project schema.
  * Improved user experience with form validation and dynamic slug generation.

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>
  Co-authored-by: QRenjie <renjie.qin@brain.im>

- **pam:** Refactor PAM project schemas and enhance API handling and UI ([cb48ca9](https://github.com/qlover/brain-toolkit/commit/cb48ca9c5f1d6725c31c046081736e4a6534c203)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - refactor(pam): Update PAM project schemas and interfaces for improved API handling
  * Introduced `PAMApiProjectSchemaType` to represent API responses, enhancing data handling in the project management flow.
  * Updated `PAMController`, `PAMService`, and related interfaces to utilize the new schema type for search functionality.
  * Refactored `PAMProjectRepo` to implement a new search parameters interface, allowing for user-specific data retrieval.
  * Adjusted UI components to align with the new schema, ensuring consistent data representation across the application.
  - refactor: update PAM project schemas and interfaces for improved type safety
  * Changed PAM project schemas to use more descriptive types, including renaming and restructuring.
  * Updated interfaces across the PAM service and repository layers to reflect new schema types.
  * Refactored search and create project methods to utilize the new types, enhancing type safety and clarity.
  * Introduced a new utility type `Join` for better handling of environment fields in queries.
  * Adjusted frontend components to align with updated types, ensuring consistency across the application.
  - feat(pam): Enhance project management with detail and edit functionalities, including API integration and UI updates
  - feat: Refactor PAM project and environment schemas, update repository and service logic
  * Updated BaseRepository to allow default type for generic parameters.
  * Refactored PAMProjectRepo to utilize new environment schemas and improve type safety.
  * Introduced validation for environment names and IDs in PAMService.
  * Added new error identifiers for environment ID and variable key duplication.
  * Updated routes and API interfaces to reflect changes in project and environment handling.
  * Enhanced PAMForm and PAMFormEnvironments components to support new schemas and validation logic.
  * Improved overall type definitions for project and environment handling in schemas.
  - feat(pam): Update project schemas and interfaces for improved handling, enhance UI components with Ant Design icons, and remove unused modal component
  - feat(pam): Refactor PAMToolbar to include create button and update styles for improved UI

  ***

  Co-authored-by: QRenjie <renjie.qin@brain.im>
  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** Implement project deletion functionality and update related components ([927ac11](https://github.com/qlover/brain-toolkit/commit/927ac116ed3a102fd62b3d6f70c70bbb3e7c017b)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

- **pam:** Update default search parameters to include sorting by visibility ([4c2377e](https://github.com/qlover/brain-toolkit/commit/4c2377ef9370bbe37f10ce37e75cd1d3339bd86c)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

- **pam:** Stability fixes for infinite scrolling and paginated sorting in the project list ([57d6e02](https://github.com/qlover/brain-toolkit/commit/57d6e029f2721381ba27293785f5731410744674)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - fix(pam): Update .gitignore to include .vscode and ensure .cache is properly ignored
  - feat(pam): Add infinite scrolling functionality for project list and integrate load more trigger component
  * Introduced `PAMFacadeInfinite` to manage infinite scrolling behavior for project lists.
  * Implemented `PAMLoadMoreTrigger` component to handle loading more projects as the user scrolls.
  * Updated `PAMRoot` to utilize the new infinite scrolling features, enhancing user experience with seamless data loading.
  * Refactored existing project management logic to support the new loading strategy.
  - refactor(pam): Simplify user info retrieval by updating return type in OAuthWrapperController
  * Removed unused import of OAuthUserInfoResponse.
  * Changed return type of getUserInfo method to Promise<UserSchema> for improved clarity and type safety.

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** Implement handler for successful project creation to reset project list ([dfbd307](https://github.com/qlover/brain-toolkit/commit/dfbd3076ae03901e3e5c768a7d5ed261d45a2047)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - Added `handlerCreateSuccess` method to manage post-creation logic, resetting the project list and reloading from the first page.
  - Integrated this method into the project creation flow to enhance user experience by ensuring the latest data is displayed after a project is created.

  Co-authored-by: QRenjie <renjie.qin@brain.im>

- **pam:** Enhance internationalization support and refactor environment handling ([f2e203c](https://github.com/qlover/brain-toolkit/commit/f2e203c86310d494b8fa9314d49ce34bd3867644)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - feat(pam): Implement handler for successful project creation to reset project list (#78)
  * Added `handlerCreateSuccess` method to manage post-creation logic, resetting the project list and reloading from the first page.
  * Integrated this method into the project creation flow to enhance user experience by ensuring the latest data is displayed after a project is created.

  Co-authored-by: QRenjie <renjie.qin@brain.im>
  - feat(pam): Enhance internationalization support and refactor environment handling
  * Added new validation messages for required environment variable keys and values in `validators.ts`.
  * Introduced a new `page.pam.ts` file for PAM page-specific internationalization strings, including titles, descriptions, and labels.
  * Refactored `PAMI18n.ts` to integrate new internationalization keys and improve structure.
  * Updated `PAMEnvironmentSchema.ts` to utilize new validation messages for environment variables.
  * Replaced hardcoded strings in various components with internationalized strings from `PAMI18n`, enhancing localization support.
  * Removed deprecated `PAMEnvironmentBlock` component and replaced it with a more modular `PAMFormEnvironmentBlock` for better maintainability.
  * Improved user feedback and error handling in forms related to environment variables.

  Co-authored-by: QRenjie <renjie.qin@brain.im>

  ***

  Co-authored-by: QRenjie <renjie.qin@brain.im>
  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** Add PAM page subtitle and enhance styling components ([52e6c39](https://github.com/qlover/brain-toolkit/commit/52e6c3981f9691a3dd7f09727ae835d8b46df2a5)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - Introduced a new subtitle for the PAM page to improve user context and navigation.
  - Added a new `pam.css` file containing presentation utilities for better UI consistency.
  - Updated various components to utilize the new styles, enhancing the overall visual experience.
  - Refactored existing components to improve styling and maintainability, including updates to `PAMForm`, `PAMProjectCard`, and `PAMToolbar` for better alignment with design standards.

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** Implement keyword search functionality in PAMToolbar and update interface ([7bd4070](https://github.com/qlover/brain-toolkit/commit/7bd4070793bae3389d0f8e81d2eb01c0e2a2d30a)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** Update event_category to event_type in OAuth routes and enhance type definitions ([622a919](https://github.com/qlover/brain-toolkit/commit/622a919a148a6b703ea8f74cec586ddd7d187fdb)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

#### 🐞 Bug Fixes

- **apps:** 稳定 Dropdown 定位并消除首次展开闪动 ([c8d5514](https://github.com/qlover/brain-toolkit/commit/c8d5514c4282afe7eb7b77fcd11a01ff912ab466)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  先按最终 minWidth 测量再显示，并忽略 ResizeObserver 首次回调，避免打开时位置跳动。

- **pam:** 修正列表项 host 链接截断布局 ([d66b0c7](https://github.com/qlover/brain-toolkit/commit/d66b0c726aeab950d21e36918dff1cbdd148753a)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  将 truncate 放到外层容器，避免 a 标签自身影响省略显示。

- **pam:** Correct package name and version in package.json; update changelog header ([c9d43d4](https://github.com/qlover/brain-toolkit/commit/c9d43d4c4b2fda92a70d8b846bf4d0ac206f433a)) ([#82](https://github.com/qlover/brain-toolkit/pull/82))

- **pam:** Update PAMVariableSchema to make id optional and refactor PAMFormEnvironments for improved variable handling ([a25fd85](https://github.com/qlover/brain-toolkit/commit/a25fd85f22e51102158a9d4e0318c3d21952d48a)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - Made the `id` field in `PAMVariableSchema` optional to allow for more flexible variable management.
  - Refactored `PAMFormEnvironments` to streamline the addition, update, and removal of environment variables, ensuring proper handling of key-value pairs and maintaining unique identifiers for each variable.
  - Enhanced validation checks for incomplete variables and improved user feedback in the UI.

  Co-authored-by: QRenjie <renjie.qin@brain.im>

- **pam:** Update PAMFormEnvironments to use PAMEnvWriteable and improve linting scripts ([edefc7b](https://github.com/qlover/brain-toolkit/commit/edefc7b46321cf25d391175f65f69816fec0bb42)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** Enhance session handling by adding error management for used refresh tokens ([a4c9166](https://github.com/qlover/brain-toolkit/commit/a4c9166596e99f0804435807b2be179765a7ef90)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

#### ♻️ Refactors

- **pam:** remove unused view mode storage key and enhance configuration ([dea1d77](https://github.com/qlover/brain-toolkit/commit/dea1d775978d5e1513535082c4df45e5ea80ca6c)) ([#86](https://github.com/qlover/brain-toolkit/pull/86))
  - Removed the `pamViewModeStorageKey` from `common.ts` as it was no longer utilized.
  - Introduced `pamStorageKey` in `SeedConfigInterface` to manage PAM state persistence.
  - Updated `AppConfig` to initialize `pamStorageKey` from environment variables.
  - Refactored `PAMFacade` to utilize the new `pamStorageKey` for state management.
  - Adjusted `PAMRoot` to apply persisted view mode after component mount for improved user experience.

- **apps:** replace shell antd with lightweight UI primitives ([c4f7c55](https://github.com/qlover/brain-toolkit/commit/c4f7c55a1efaf7b90b204853d52263357870c77e)) ([#85](https://github.com/qlover/brain-toolkit/pull/85))

  Align brain-oauth and pam with fe-base: local Button/Dropdown/Tooltip/Table,
  antd-free ClientRootProvider, and drop global antd CSS from the app shell.

- **pam:** code structure for improved readability and maintainability ([12a375a](https://github.com/qlover/brain-toolkit/commit/12a375a97113121ec047ebf63658acc89bb4cd99)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))

- **pam:** Refactor PAM to replace SupabaseBridge with SupabaseRepo across services ([8b9e2c0](https://github.com/qlover/brain-toolkit/commit/8b9e2c00e55b497967ea260a5ab3bfd90eeef00c)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - refactor(pam): replace SupabaseBridge with SupabaseRepo in OAuth provider
  - refactor(pam): remove SupabaseBridge and replace with SupabaseRepo across services and interfaces
  - refactor(pam): remove SupabaseBridge and integrate SupabaseRepo across repositories and services
  - refactor(pam): remove SupabaseBridge and replace with SupabaseRepo in Locales and PAMProject repositories
  - refactor(pam): remove SupabaseBridge and update related interfaces and services to use Resource types

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **server:** Update server interfaces and context management ([e1dade5](https://github.com/qlover/brain-toolkit/commit/e1dade5497ee57c6176cf3791ccf4758b927a892)) ([#64](https://github.com/qlover/brain-toolkit/pull/64))
  - Replaced `ServerInterface` with `BootstrapServerInterface` in `BootstrapServer` and `NextApiServer`.
  - Introduced `ServerContext` and `ServerContextInterface` to manage server state and context.
  - Removed `ServerStateInterface` and refactored related logic to use the new context management.
  - Updated `RequestLogsRepository` and `OAuthUserService` to utilize the new context for state management.
  - Enhanced `NextApiHandler` to handle context-based operations.
  - Refactored `SupabaseOAuthProvider` to align with new context structure.
  - Adjusted various plugins and handlers to integrate with the new server context.

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>
