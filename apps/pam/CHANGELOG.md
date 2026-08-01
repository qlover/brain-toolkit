# pam

## 1.0.0

### Major Changes

#### ✨ Features

- **pam:** 敏感变量加密、env 独立 API 与路径参数修复 ([26f0d3f](https://github.com/qlover/brain-toolkit/commit/26f0d3f8c837e38833d08de091ce1dcce8684d5c)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  支持敏感变量脱敏/合并落库加密，补齐环境 CRUD 与变量保存接口，并修复 buildApiWithPath 多参数覆盖问题。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 项目 general/environments 详情页并去掉列表编辑入口 ([85521b9](https://github.com/qlover/brain-toolkit/commit/85521b911ecb0993eb7d24d731cb1c2efbf4734c)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  新增详情壳与分字段保存/环境变量管理页，创建弹窗保留导入能力，列表点击进入 general。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** AppApi 接入 AborterPlugin，补充 stop 与 PAMAbortId ([38bad45](https://github.com/qlover/brain-toolkit/commit/38bad458e6f557b2982861940d420e15b816ade7)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  为详情/环境读取接入 abortId，并对并发 searchProjects 做 inflight 去重。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 默认邮箱 OTP 登录并跳转首页 ([1d736d8](https://github.com/qlover/brain-toolkit/commit/1d736d8c7c9798a786ab9bbed1f35fd02883e685)) ([#93](https://github.com/qlover/brain-toolkit/pull/93))

  禁用手机号 Tab 点击，登录成功后统一回首页而非 developer 页面。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 首页预取公开列表并优化列表展示 ([088ef3b](https://github.com/qlover/brain-toolkit/commit/088ef3b23cbfee2487cd22c46bee8dfe64967b14)) ([#93](https://github.com/qlover/brain-toolkit/pull/93))

  通过 RSC/ISR 预取首屏公开项目消除 loading 闪烁，列表标题下方改为显示完整 URL。

  Co-authored-by: Cursor <cursoragent@cursor.com>

#### 🐞 Bug Fixes

- **pam,brain-oauth:** 修复 next-kit 迁移后的类型与构建错误 ([ceb595a](https://github.com/qlover/brain-toolkit/commit/ceb595a495437c886956738be796d132d95c8322)) ([#100](https://github.com/qlover/brain-toolkit/pull/100))

  放开 PAMSupabaseRepo.search 以支持 ilikeOr；transpile next-kit 并统一 corekit-bridge 版本，避免 ESM 目录导入失败。

- **pam,brain-oauth:** 修复 Pages SSG 时 next-intl Context 不一致 ([97cae46](https://github.com/qlover/brain-toolkit/commit/97cae46f938c5e4003e2c47b588a7b7b64425d89)) ([#100](https://github.com/qlover/brain-toolkit/pull/100))

  i18n hook 改回 app 内调用 next-intl，只复用 kit 的 TranslateI18nUtil，避免预渲染 /about 等页时空 Error。

- **pam:** 语言切换时保留动态路由 params ([4eea15d](https://github.com/qlover/brain-toolkit/commit/4eea15d98d227e2a7d0554829b2b62f0c62b2d0f)) ([#99](https://github.com/qlover/brain-toolkit/pull/99))

  next-intl 的 usePathname 返回模板路径，切换语言时一并传入
  useParams，避免地址变成 /projects/[projectId]/general。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 非 owner 详情只读，并去掉 API 错误二次 toast ([620e83a](https://github.com/qlover/brain-toolkit/commit/620e83a6e29eff30c130b49836a2a0fa1d4ce6c2)) ([#98](https://github.com/qlover/brain-toolkit/pull/98))

  详情接口返回 is_owner；General/Environments 按 canEdit 禁用编辑；
  业务 catch 不再重复弹 DialogErrorPlugin 已处理的错误。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 加固 useStrictEffect 以兼容 Strict Mode 二次挂载 ([ebfb6ee](https://github.com/qlover/brain-toolkit/commit/ebfb6ee62ed0601e4982968993d2a6a6f2fe3d31)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 忽略 AbortError，避免取消请求弹 toast 或刷错误日志 ([a193c83](https://github.com/qlover/brain-toolkit/commit/a193c83ccb06cfd6f1e5d91797cda1ad95d09bf4)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  Strict Mode 重挂与页面切换触发的取消视为预期行为。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam,brain-oauth:** 中间件进页门禁并修复 Pages 主题闪烁 ([a5bdd08](https://github.com/qlover/brain-toolkit/commit/a5bdd08b95389b00abe5e6766e052b2a1b1bae0a)) ([#96](https://github.com/qlover/brain-toolkit/pull/96))

  以 LOGINED_PAGES 为唯一进页鉴权，去掉 WithUserAuth 全屏门；Pages 补 favicon 与主题初始化脚本，主题菜单按偏好选中并同步 brain-oauth。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam,brain-oauth:** ThemeSwitcher 使用 SupportedTheme 泛型 ([b1d3029](https://github.com/qlover/brain-toolkit/commit/b1d3029e15a7b0f473db17ae498d9a57565a8199)) ([#96](https://github.com/qlover/brain-toolkit/pull/96))

  useTheme 默认不含 pink，导致 setTheme 类型报错。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 将 Next OAuth 模板文案替换为 PAM 品牌 ([2f31e57](https://github.com/qlover/brain-toolkit/commit/2f31e57db54bc83a2804125283c9c47602b769af)) ([#96](https://github.com/qlover/brain-toolkit/pull/96))

  更新首页/文档/授权/Playground 等 i18n 标识、manifest 名称与登出日志 auth_provider。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 避免裸 hidden 类被浏览器扩展覆盖显示 ([e30e743](https://github.com/qlover/brain-toolkit/commit/e30e74364f028dcb510a8aeb9be90d26a6bc0e85)) ([#95](https://github.com/qlover/brain-toolkit/pull/95))

  将 hidden + 响应式显示改为 max-\*:hidden，条件显隐改用 HTML hidden，避免 DeepL 等扩展注入的 .hidden 压过 Tailwind utilities。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam,brain-oauth:** 恢复误改样式并同步去掉裸 hidden ([cc20228](https://github.com/qlover/brain-toolkit/commit/cc20228ab5b593c0596e87e11364cbcce25ecb08)) ([#95](https://github.com/qlover/brain-toolkit/pull/95))

  还原登录表单 max-w-[420px] 与 PAMForm 圆角；brain-oauth 仅替换 hidden 写法。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** OAuth token/userinfo/revoke 返回扁平 RFC JSON ([02855a3](https://github.com/qlover/brain-toolkit/commit/02855a3307c165bf3b1562a2784f9a9e5ee811e9)) ([#94](https://github.com/qlover/brain-toolkit/pull/94))

  兼容 Supabase 等标准 OAuth 客户端，不再使用 { success, data } 信封。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **web:** 更新 OAuth 授权流程以强制登录 ([7c991fa](https://github.com/qlover/brain-toolkit/commit/7c991fa7790c4d8d485a8abda3abe8c2afa96df7)) ([#94](https://github.com/qlover/brain-toolkit/pull/94))

  将 `ROUTE_OAUTH_AUTHORIZE` 添加至 `LOGINED_PAGES`，确保未登录用户访问授权页时自动重定向至登录页面，并在登录后返回授权页

- **pam:** 修复 OAuth token 被加 locale 及 refresh token 存储错误 ([773edfc](https://github.com/qlover/brain-toolkit/commit/773edfce0106a032c908669c3313680686f47e76)) ([#93](https://github.com/qlover/brain-toolkit/pull/93))

  跳过 /oauth/token 等机器端点的 i18n 重写，并将 provider_session_token 改为存储 Supabase refresh token，避免 PKCE 换票 invalid_grant。

  Co-authored-by: Cursor <cursoragent@cursor.com>

#### ♻️ Refactors

- **pam:** 迁移至 @qlover/next-kit 并清理无用代码 ([1b0f5a4](https://github.com/qlover/brain-toolkit/commit/1b0f5a4075edc2ced794831cfbd2b1076e6d7b7b)) ([#100](https://github.com/qlover/brain-toolkit/pull/100))

  将 schema、校验器、仓储、通用 UI/工具改为复用 next-kit，并移除未使用的演示与残留实现。

- **brain-oauth:** 迁移至 @qlover/next-kit 并清理无用代码 ([f55d54c](https://github.com/qlover/brain-toolkit/commit/f55d54c310fd2dc3534ad767c7e0d103b3f5c485)) ([#100](https://github.com/qlover/brain-toolkit/pull/100))

  与 pam 对齐复用 next-kit，删除应用内重复模块及未接线的死代码。

- **pam:** 列表进详情改为 next-intl Link ([154ab48](https://github.com/qlover/brain-toolkit/commit/154ab48656494511b3dc7fdf56e2ae9b484c4ead)) ([#99](https://github.com/qlover/brain-toolkit/pull/99))

  用带 locale 的 Link 替换 button + onOpen，悬停/新开页都能保留语言前缀。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 项目详情路径统一为 route.ts 常量 ([f270c51](https://github.com/qlover/brain-toolkit/commit/f270c517cb6b8a3d6207ebec32c709467c71d388)) ([#99](https://github.com/qlover/brain-toolkit/pull/99))

  抽出 ROUTE*PROJECT*\* 模板，供 next-intl pathnames 与 Link/跳转复用。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 按列表/项目壳/general/environments 拆分 i18n ([1cd92d1](https://github.com/qlover/brain-toolkit/commit/1cd92d13076583f33855911fde803179c0ce1fa1)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  将原 page_pam 文案拆到对应页面命名空间，并为共用 env 表单抽离 PAMEnvFormI18n 结构类型。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 详情由 Shell 统一拉取，General 复用 context ([7e20409](https://github.com/qlover/brain-toolkit/commit/7e20409e9747018250588f41ea96209ddfd3d3c8)) ([#97](https://github.com/qlover/brain-toolkit/pull/97))

  去掉 General 二次 getProjectDetail；列表与环境挂载改用 useStrictEffect + stop。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 同步 next-oauth 邮箱登录 PKCE 流程 ([332f9ff](https://github.com/qlover/brain-toolkit/commit/332f9fffd74843606c21d87c29924995473b8fb7)) ([#93](https://github.com/qlover/brain-toolkit/pull/93))

  将 magic link 从 hash token 改为服务端 PKCE 换 session，并规范化 SITE_URL 与回调页 bootstrap 时机。

  Co-authored-by: Cursor <cursoragent@cursor.com>

## 0.3.0

### Minor Changes

#### ✨ Features

- **pam:** 未登录隐藏新建与编辑删除入口 ([592a82a](https://github.com/qlover/brain-toolkit/commit/592a82ad5d53cc6da3274131a804c093fc2e43ea)) ([#91](https://github.com/qlover/brain-toolkit/pull/91))

  按登录态控制工具栏新建、列表/卡片操作与弹窗，访客不再看到 mutate 按钮。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 登录页改为 PAM 品牌文案并展示版本号 ([1877a4f](https://github.com/qlover/brain-toolkit/commit/1877a4fd0433741e19b1309dea4ad670a0e9e248)) ([#91](https://github.com/qlover/brain-toolkit/pull/91))

  禁用尚未支持的手机登录 Tab，登录成功后回到首页。

  Co-authored-by: Cursor <cursoragent@cursor.com>

## 0.2.0

### Minor Changes

#### ✨ Features

- **pam:** 优化搜索 UX 与多字段命中率 ([6bf773a](https://github.com/qlover/brain-toolkit/commit/6bf773abca5e32dc1289418b7f10415de55efb7e)) ([#88](https://github.com/qlover/brain-toolkit/pull/88))

  将 FTS 改为项目文本字段 ILIKE，缩短防抖并避免搜索闪空；列表同时展示分类与技术栈。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 将列表与卡片 UI 对齐 v3 原型 ([3b657a0](https://github.com/qlover/brain-toolkit/commit/3b657a0446e600ddc15f393bbeb470690aa10308)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  仅私有显示锁、文字操作菜单（分组与删除红色）、环境 chip 原型配色，以及锁与环境入口的响应式尺寸。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 优化列表与卡片布局密度与交互 ([124d07e](https://github.com/qlover/brain-toolkit/commit/124d07ee49dbd39fed60585b7f98eaad55582e4f)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  大屏列表三行排布并加大标题；去掉多余打开仓库/部署入口；userId 可省略复制；卡片收紧空状态与 logo 内边距，并同步 v3 原型。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 对齐新建编辑弹窗表单到 v3 原型 ([d38820d](https://github.com/qlover/brain-toolkit/commit/d38820dae538d147c36fa2653151e0dab7c5d5a1)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  统一 field 样式与可见性切换，操作栏移入 Modal footer，并修正 secondary/elevated 背景层次。

  Co-authored-by: Cursor <cursoragent@cursor.com>

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

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pam:** 修正列表项 host 链接截断布局 ([d66b0c7](https://github.com/qlover/brain-toolkit/commit/d66b0c726aeab950d21e36918dff1cbdd148753a)) ([#87](https://github.com/qlover/brain-toolkit/pull/87))

  将 truncate 放到外层容器，避免 a 标签自身影响省略显示。

  Co-authored-by: Cursor <cursoragent@cursor.com>

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

  Co-authored-by: Cursor <cursoragent@cursor.com>

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
