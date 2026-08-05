# pamenv-cli

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
