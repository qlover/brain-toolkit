# pamenv-cli

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
