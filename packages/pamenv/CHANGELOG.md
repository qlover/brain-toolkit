# pamenv-cli

## 2.0.0

### Major Changes

#### ✨ Features

- **pamenv:** pamenv v2 首批实现（run / 敏感隔离 / 环境界面） ([60ed506](https://github.com/qlover/brain-toolkit/commit/60ed506ed7ec1054483f6ba312161b713b371c25)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))
  - docs(pamenv): 新增 v2 设计文档（变量注入进程，.env 改为输出格式）

  (cherry picked from commit a763148ee98441502e98e2977831a710c4775570)
  - feat(pam): 新增变量注入接口、受保护环境与访问审计
  * 新增权限 pam_environments_inject 与 POST .../resolve，供 pamenv run
    在内存中获取变量（Cache-Control: no-store）
  * pam_environments_export 收紧为 team_admin / team_owner
  * 环境新增 is_protected：受保护环境的 resolve 还需导出权限
  * 新增 pam_env_access_logs，记录 resolve / export（不记录键值）
  * 网页端环境页：受保护开关与访问记录（仅导出权限可见）
  * SQL：000 与 001（第 8 节）同步

  (cherry picked from commit 491cbfafbdc4bfd85d9e7a6946789d3ef3ece025)
  - feat(pamenv): 新增 run 注入进程与 render 多格式输出
  * pamenv run 将变量注入子进程，不写磁盘
  * pamenv render 支持 dotenv / json / yaml / toml
  * 修复 login --url / --domain 被根命令吞掉
  - feat(pam): 敏感变量只经 run 注入进程，其它出口不再给出明文
  * export 接口不再解密，敏感值一律为空；resolve 是唯一会解密的接口
  * render 省略敏感变量，并在 stderr 列出键名
  * pull 敏感变量只写键名、值留空
  * push 已有敏感键本地为空时保留远端值；成功后清空本地文件与基线中的敏感值
  * 移除 changeset 文件（发布由 PR 自动完成）

  (cherry picked from commit ca2a3a581dd75f1aece3a6be5b8be2dd87360520)
  - perf(pamenv): run 单请求注入，服务端减少重复鉴权查询
  * 新增 POST /api/pam/:projectRef/resolve（按 slug/id + 环境名），
    run -e 不再先搜索项目；接口出错时回退原流程
  * CLI 启动不再请求 /api/locales/json，仅在格式化 API 错误时按需拉取
  * PamCliTokenService.verifyToken 请求内缓存，避免重复查 token 表
  * assertOrgPermission 请求内缓存并并行加载会话/项目/权限
  * resolve/export 与权限校验并行取环境；访问记录改用 after() 写入

  本地实测 run -e 由约 6-11s 降至约 1.8s。

  (cherry picked from commit 162792f056d55d38d5cf5fa5dd5d7e49544dfd7f)
  - feat(pamenv): 敏感变量用每个环境固定的随机占位符代替空值
  * 占位符 **PAM*SENSITIVE*<hex>** 由 PAM_ENV_SECRET_KEY 对环境 id
    做 HMAC 得出，每个环境不同且固定，无需新增数据库字段
  * export 返回占位符和 sensitivePlaceholder；pull/render 原样写出
    （旧服务端无占位符时 render 仍省略敏感变量）
  * 写回时本环境占位符等同空值（保留原值）；合并后残留的占位符一律
    拒绝，CLI push 推送前也会检查
  * push 成功后本地敏感值换回占位符；run 发现 .env\* 中注入的键写着
    占位符时额外提示

  (cherry picked from commit f1c60a805bccc9894fac173baf245f1ebe3ab054)
  - feat(pam): 升级环境管理界面
  * 横向环境标签、使用方式卡片、变量表格与导入预览
  * 设置（URL / 保护 / 删除）与访问记录筛选分页
  * 吸底未保存条、只读视图；修复切换 / 双请求 / 移动端布局

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** 环境变量拆表，并支持懒加载与增量保存 ([125f23f](https://github.com/qlover/brain-toolkit/commit/125f23fc9e4478f2505652a037bdaa9204c77067)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))
  - feat(pam): 环境变量拆到 pam_env_variables 表
  * 新增 pam_env_variables（按 environment_id + key），读写走新表
  * 保留 pam_environments.variables JSONB 不 DROP，应用停止写入
  * 迁移脚本回填 JSONB → 行；RPC update_project_with_environments 同步写行并按行组装返回
  * API 仍返回 variables[]，CLI / Web 无感
  - fix(pam): RPC 停止写入 legacy variables JSONB

  环境变量只读写 pam_env_variables；旧列保留但不更新。
  - feat(pam): 环境列表懒加载变量并支持增量保存

  列表只返回元数据；选中环境再拉变量。Web 保存走 upsert/deleteIds，CLI 仍全量替换。

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pamenv:** 本地身份隔离与 fail-closed 安全门禁 ([0608687](https://github.com/qlover/brain-toolkit/commit/06086878e46d15c3ffc9c4d0a229f98853d0065c)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))

  cwd 有 .pam 时强制本地凭证；同目录多项目 env 文件绑定；
  精确项目解析、权限 fail-closed、403 零落盘；服务端先鉴权再读库并双 redact。

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pam:** search 支持 mine/writable，CLI/Web 过滤对齐 ([1d91f08](https://github.com/qlover/brain-toolkit/commit/1d91f08b5b5d0e2c491c5f16381a43dba3fe4938)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))
  - feat(pam): search 支持 mine/writable 与 compact 视图

  服务端 filters.mine / filters.writable 在分页前过滤；
  view=compact 返回 CLI 精简字段，降低列表负载。
  - feat(pam): 首页筛选增加我拥有的与可编辑

  筛选面板对齐 CLI：filters.mine / filters.writable，登录可见。
  - feat(pamenv): projects 对齐 Web search 过滤与精简列表

  支持 category/visibility/sort/page、--mine/--writable（服务端 filters），
  默认 page-size 10 与 view=compact；文档列出全部参数。
  - fix(pamenv): pull 权限用例加 force 避免冲突提示超时

  本地与远端内容不一致时会卡在交互冲突；加 force 跳过提示以覆盖写权限校验。

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pamenv:** pull/render 脱敏与 push 覆盖/--unset，并加固无基线安全 ([bb5821b](https://github.com/qlover/brain-toolkit/commit/bb5821b60f6767404c0203a81c4cba97cbf4db94)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))
  - feat(pamenv): pull/render 脱敏落盘，push 支持覆盖与 --unset

  敏感值永不写明文；文件 push 缺键即删，空/占位符 keep。
  brain-oauth 的 dev 脚本改用 pamenv run 注入本地环境。
  - fix(pamenv): 无基线单边保留，-y 自动标敏感且大删仍确认

  避免首次 push/pull 误删对侧独有键；启发式敏感标记与大变更刹车。

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pamenv:** 语言包静态优先、run 明文边界与 OS 绑定凭证 ([3330c83](https://github.com/qlover/brain-toolkit/commit/3330c83697cf64959ffbceb6ea7afee5e767e9ff)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))

  静态 JSON 覆盖库表旧文案；文档与 CLI/网页标明 run 明文边界；
  Bearer token 迁入 DPAPI/钥匙串/0600 vault，并支持旧 config 迁移。

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pamenv:** @pamenv/next 注入插件，支持 debug 与 envPriority ([258a07c](https://github.com/qlover/brain-toolkit/commit/258a07cea3d59cb1a004b960580641979ea894a2)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))
  - feat(pamenv): 增加 @pamenv/next，brain-oauth 开发不再包一层 run

  导出 injectPamenvProcessEnv，Next 配置用 createPamenvPlugin 在加载前注入。
  brain-oauth 仅在 localhost 的 next dev 拉取 local 环境。
  - feat(pamenv): inject/next 默认安静，debug 才打元数据日志

  程序化注入默认不打印 Using config / 键名 / baseUrl；安全警告仍输出。
  - feat(pamenv): 支持 envPriority，本地可临时覆盖远程变量

  默认 remote；local 时按 process → .env\* → PAM，占位符仍 resolve 明文。
  - chore(pamenv-next): 开放 npm 发布配置

  去掉 private，补齐 publishConfig / repository，依赖改为 workspace:^。

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pamenv:** 增加 @pamenv/vite，并支持本地登录提示与公开前缀配置 ([b7bf305](https://github.com/qlover/brain-toolkit/commit/b7bf305e169190e3873f08b3d8320ca61bb58155)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))
  - feat(pamenv): 增加 @pamenv/vite，dev 可直接注入 PAM 环境

  Vite 插件在 config 早期钩子写入 process.env；默认仅 serve。
  - feat(pamenv): 本地未登录提示与可配置公开前缀告警

  未登录时提示 pamenv login --local；扩展客户端前缀检测，并支持 clientPublicPrefixes。
  - docs(pamenv-next): 补充项目本地 .pam 登录说明
  - docs(pamenv-vite): 补充本地登录与 clientPublicPrefixes
  - feat(pamenv-vite-app): 增加 @pamenv/vite 验证示例应用
  - fix(workspace): 锁定 @types/react，修复 Heroicons 类型报错

  pamenv-vite-app 曾拉起 @types/react 19.3，导致 pam/brain-oauth
  中 Heroicons 无法赋给 ComponentType<SVGProps>。对齐示例应用依赖，
  并在 pnpm overrides 中固定 19.2.2。

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

#### 🐞 Bug Fixes

- **pam:** 受保护环境禁止成员改写，敏感标记改为提示+手动勾选 ([3b3f18b](https://github.com/qlover/brain-toolkit/commit/3b3f18b823224ea99f4a3fdf84d4f75aae654b23)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))
  - fix(pam): 受保护环境禁止成员改写，密钥样式变量不再以明文保存

  成员不能再 push 或在网页上修改受保护环境。
  DATABASE_URL 一类键名在保存、fork 和 pull 时按敏感值处理。
  导出响应禁止缓存；Windows 上凭证文件收紧到当前用户。
  - refactor(pamenv): 取消按键名自动标敏感，改为提交时提示与手动勾选

  服务端与 CLI 不再因 DATABASE_URL 一类键名强制敏感。
  push 交互预勾疑似项；-y 只提示；网页保存前同样提示。

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- **pamenv:** 修复 Linux CI 权限用例并补充 OIDC TODO ([34222ff](https://github.com/qlover/brain-toolkit/commit/34222ff90ef38c611bcb9c609dd932e2143edc12)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))
  - fix(pamenv): 修复 Linux CI 权限用例并补充 OIDC TODO

  旧 config/fixture 过宽权限导致 vault 迁移与 push 写入失败；契约测试改用 0600 fixture。
  pamenv-v2 文档补充 CI OIDC 待办切片。
  - chore(pam): 移除多余的 generateLocales.mjs

  语言包仍由 next.config 中的 generateLocales.ts 在启动/构建时生成。

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

#### 📝 Documentation

- **pamenv:** 补充 Next/Vite 接入说明与 npm 链接 ([98494e3](https://github.com/qlover/brain-toolkit/commit/98494e3b439e6fea762f1c28afb6801ee5129df6)) ([#185](https://github.com/qlover/brain-toolkit/pull/185))

  根 README 增加 pamenv 包与 npm 入口；pamenv README / v2 文档
  补充 @pamenv/next、@pamenv/vite 用法与常用选项。

## 1.11.0

### Minor Changes

#### ✨ Features

- **pamenv:** pull/push 按键三方合并，冲突时 pull 默认远端、push 默认本地 ([ee4e49f](https://github.com/qlover/brain-toolkit/commit/ee4e49f2cb24d3140b6a0a2ebf1c7be072586791)) ([#173](https://github.com/qlover/brain-toolkit/pull/173))
  - 以同步基线逐键合并：只有一边改过的键自动采用该边，两边都改才算冲突
  - 冲突时列出冲突键并选择（pull 默认远端值，push 默认本地值，可改选或取消），
    之后提示手动编辑本地文件再 push；-f 直接按默认一边处理
  - pull 保留本地未推送的修改并提示；push 把远端单独改过的键合并进本地文件，
    不再整份覆盖远端
  - 无基线时所有不同的键都按冲突处理

- **pamenv:** --help 描述跟随 locale 显示中英文 ([2fd6e94](https://github.com/qlover/brain-toolkit/commit/2fd6e94a31f3a54745c4b18f08a713b56c7cb973)) ([#173](https://github.com/qlover/brain-toolkit/pull/173))
  - 命令、参数、选项描述及 Usage / Options 等标题改为 i18n（pamenv_cli_help）
  - 注册命令前先读取配置的 locale（仅识别 --local，不请求 PAM），
    使 --help 也按当前语言显示

## 1.10.0

### Minor Changes

#### 📝 Documentation

- **pamenv:** 重构 README，PAM CLI 文档页直接渲染 README ([04261a7](https://github.com/qlover/brain-toolkit/commit/04261a7931e373569f92d3f1c6a6b1a5b30ef5e3)) ([#165](https://github.com/qlover/brain-toolkit/pull/165))
  - README / README_EN 按使用场景重写：快速开始、命令一览、全局参数、环境与文件、init / fork / pull / push / remove、配置与语言、权限
  - 去掉本地状态文件路径、文件权限、token 实现、文案生成流程、monorepo 构建等与使用无关的内容
  - /docs/cli 页面改为构建时读取 pamenv README（zh → README.md，其余 → README_EN.md），用 react-markdown + remark-gfm 渲染，文档只维护一份

## 1.9.0

### Minor Changes

#### ✨ Features

- **pamenv:** API 错误改为请求 /api/locales，不再写入 config ([94590da](https://github.com/qlover/brain-toolkit/commit/94590daafc3c7dfb6d25c8097d1a20355000a646)) ([#160](https://github.com/qlover/brain-toolkit/pull/160))

  命令开始时拉取 api 命名空间到内存；去掉 localeMessages 缓存。
  CLI 交互文案仍使用本地 dist/locales。

#### 🐞 Bug Fixes

- **pamenv:** 补齐 push/fork/remove 等硬编码英文提示 ([b2f3a29](https://github.com/qlover/brain-toolkit/commit/b2f3a29fbfdd1b2662b5013dd5e9eeb79d4597b9)) ([#160](https://github.com/qlover/brain-toolkit/pull/160))

  敏感变量确认、缺值报错、diff 分区与 fork/remove 文案改走 pamenv_cli i18n。

- **pam,pamenv:** device 登录页 i18n 与 verification URI locale ([2220913](https://github.com/qlover/brain-toolkit/commit/2220913bfe20a4899fcc61fd51c378976183c9b6)) ([#157](https://github.com/qlover/brain-toolkit/pull/157))

  设备授权页接入 PageI18n；createDeviceCode 带 locale，verification_uri 加语言前缀。

#### 📝 Documentation

- **pamenv:** 说明 CLI 本地文案与 API 错误两套来源 ([414bf5b](https://github.com/qlover/brain-toolkit/commit/414bf5bc7bd8096181b94437bc5a9d21c0778a5a)) ([#160](https://github.com/qlover/brain-toolkit/pull/160))

  CLI 交互仍走 dist/locales；api 错误从 /api/locales 请求，不写入 config。

## Unreleased

### Minor Changes

#### ✨ Features

- **pamenv:** CLI 文案保持本地 i18n；PAM `api:*` 改为请求 `/api/locales`

  `pamenv_cli` 仍由 ts2locales 生成 `dist/locales`。API 错误每次从 PAM 拉取到内存，不再写入 `config.localeMessages`。补齐 push 敏感变量等硬编码英文提示。

## 1.8.0

### Minor Changes

#### 🐞 Bug Fixes

- **pam:** 搜索按团队成员可见，修复 pamenv 解析私有项目 ([9a9b437](https://github.com/qlover/brain-toolkit/commit/9a9b437ef2ff391c354fe5d05431d1416660d579)) ([#147](https://github.com/qlover/brain-toolkit/pull/147))

  新增 022 重写 pam_search_projects；legacy search 同步 team_id；CLI 文档对齐。

#### 📝 Documentation

- **pam:** 同步角色设计文档，并对齐 pamenv 团队权限语义 ([894a1ee](https://github.com/qlover/brain-toolkit/commit/894a1eee585f3764eb4ed45aae32a1eff9b6e47e)) ([#147](https://github.com/qlover/brain-toolkit/pull/147))

  去掉协作者表述；access util 优先 permissions；文档改为 permission_key。

## 1.7.0

### Minor Changes

#### ✨ Features

- **pamenv:** CLI 按协作者权限放宽 pull/push 并限制 remove ([f4984da](https://github.com/qlover/brain-toolkit/commit/f4984da33a6f70cbd3fa9ca9c28a5d560a4261b2)) ([#132](https://github.com/qlover/brain-toolkit/pull/132))

  owner/admin/member 均可 pull/push；remove 仍仅 owner。与 PAM 协作者角色对齐。

#### 📝 Documentation

- **pamenv:** 同步协作权限说明到 README ([c12acd6](https://github.com/qlover/brain-toolkit/commit/c12acd62568eafb00f5aef1af742e1ed1e5bd558)) ([#132](https://github.com/qlover/brain-toolkit/pull/132))

  说明 owner/admin/member 对 pull/push/remove 的差异；中英文 README 对齐。

## 1.6.0

### Minor Changes

#### ✨ Features

- **pamenv:** pull/push 支持 --file 指定本地 dotenv ([dbff077](https://github.com/qlover/brain-toolkit/commit/dbff077089e810238290b01d007fcfc80071b7a9)) ([#127](https://github.com/qlover/brain-toolkit/pull/127))

  默认仍为 .env.<环境名>；可用 --file .env 在 -e local 时读写根目录 .env。pull/push 共用 PamCliLocalEnvFileUtil.resolveLocalPath。

- **pamenv:** init 从 API 拉取分类并支持自定义 ([c64c4d4](https://github.com/qlover/brain-toolkit/commit/c64c4d47158f0e19fe586d30021994dc7a244564)) ([#117](https://github.com/qlover/brain-toolkit/pull/117))

  CLI 拉取可见分类作为选项，并允许自定义必填分类。

## 1.5.0

### Minor Changes

#### ✨ Features

- **pamenv,pam:** 本地 CLI 隔离、API 错误 i18n 与 create_source ([3b93564](https://github.com/qlover/brain-toolkit/commit/3b93564206632da970426a37704642640b59f8f0)) ([#114](https://github.com/qlover/brain-toolkit/pull/114))

  支持 pamenv --local/--url/--domain 与 cwd .pam 隔离；结构化 PamCliApiError
  与 locale 缓存；将基础设施错误归一为 api:server\_\_error；CLI 建项走 admin
  客户端规避 RLS；pam_projects.create_source 记录创建来源（0=web，1=cli，2=fork）。

- **pamenv:** 独立 CLI i18n、浏览器语言同步，并压缩构建产物 ([5223b03](https://github.com/qlover/brain-toolkit/commit/5223b03b894c10e15f5fd8bd3f1f693ac303c9bb)) ([#114](https://github.com/qlover/brain-toolkit/pull/114))

  ts2locales 生成 dist/locales，运行时动态加载；常量 key 驱动交互文案；仅 pull api 错误文案。构建开启 minify、关闭 sourcemap，cli.js 体积约减半。

## 1.4.0

### Minor Changes

#### ✨ Features

- **pamenv:** 新增 remove，push 延后创建缺失环境 ([ec49038](https://github.com/qlover/brain-toolkit/commit/ec490389cc6a37d57ac1a36f6f4eac64f2bf0e67)) ([#110](https://github.com/qlover/brain-toolkit/pull/110))

  缺失 -e 环境时先完成校验与确认，再一并创建并写入变量；新增 remove 两次确认删除；void 成功响应不再误报失败；补充 defaultEnvUrl 与文档。

## 1.3.0

### Minor Changes

#### ✨ Features

- **pamenv:** 新增交互式 init 创建项目 ([91d2611](https://github.com/qlover/brain-toolkit/commit/91d2611ef31ba96f7516811866c35d7f913b41f4)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  扫描 package.json/git/.env 提供默认值，确认后创建项目与环境。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- **pamenv:** 新增 fork 命令以复刻 Web 端 fork 流程 ([421fd03](https://github.com/qlover/brain-toolkit/commit/421fd03920950dd58afe48ef1b689cded4d17bb9)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  Co-authored-by: Cursor <cursoragent@cursor.com>

#### 📝 Documentation

- 补充 pamenv init 与 Web CLI 文档 ([fd387c4](https://github.com/qlover/brain-toolkit/commit/fd387c4ca321c562967ddd2a118c8d231a9007a1)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  说明扫描默认值、环境规则、slug 软删复用及典型流程。

  Co-authored-by: Cursor <cursoragent@cursor.com>

- 补充 pamenv fork 与 Web CLI 文档 ([8f58563](https://github.com/qlover/brain-toolkit/commit/8f585631f0a3ed29e5d0b3312449b5549d9fbd08)) ([#108](https://github.com/qlover/brain-toolkit/pull/108))

  Co-authored-by: Cursor <cursoragent@cursor.com>

## 1.2.0

### Minor Changes

#### ✨ Features

- **pamenv:** 新增 cwd 的 pull/push 同步 CLI ([380d025](https://github.com/qlover/brain-toolkit/commit/380d025935b117ab3cfaa2d915a422f31295169d)) ([#102](https://github.com/qlover/brain-toolkit/pull/102))

#### 📝 Documentation

- **pamenv:** 同步 pamenv-cli 安装说明 ([6006c36](https://github.com/qlover/brain-toolkit/commit/6006c36289edbdd14fddabd40d94c626654c3a9e)) ([#106](https://github.com/qlover/brain-toolkit/pull/106))

  安装包名改为 pamenv-cli，命令示例仍使用 pamenv。

#### ♻️ Refactors

- **pamenv:** 将 npm 包名改为 pamenv-cli ([1af1107](https://github.com/qlover/brain-toolkit/commit/1af1107d4a2f60c81f74926ee185acf19c6e359c)) ([#106](https://github.com/qlover/brain-toolkit/pull/106))

  保留 bin 命令 pamenv，并同步 monorepo filter 与路径别名。

- **pamenv:** 包名改为 pamenv 并指向 CLI 文档首页 ([809b551](https://github.com/qlover/brain-toolkit/commit/809b5518dc6a29f5eed19c55e7a21a3e343048af)) ([#104](https://github.com/qlover/brain-toolkit/pull/104))

## 1.1.0

### Minor Changes

#### ✨ Features

- **pamenv:** 新增 cwd 的 pull/push 同步 CLI ([380d025](https://github.com/qlover/brain-toolkit/commit/380d025935b117ab3cfaa2d915a422f31295169d)) ([#102](https://github.com/qlover/brain-toolkit/pull/102))

#### ♻️ Refactors

- **pamenv:** 包名改为 pamenv 并指向 CLI 文档首页 ([809b551](https://github.com/qlover/brain-toolkit/commit/809b5518dc6a29f5eed19c55e7a21a3e343048af)) ([#104](https://github.com/qlover/brain-toolkit/pull/104))

## 1.0.0

### Major Changes

#### ✨ Features

- **pamenv:** 新增 cwd 的 pull/push 同步 CLI ([380d025](https://github.com/qlover/brain-toolkit/commit/380d025935b117ab3cfaa2d915a422f31295169d)) ([#102](https://github.com/qlover/brain-toolkit/pull/102))

## 0.1.0

### Minor Changes

- Initial pam-cli: interactive login, project list, pull/push to cwd `.env.<env>`
