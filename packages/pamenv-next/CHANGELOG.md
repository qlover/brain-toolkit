# @pamenv/next

## 1.2.0

### Minor Changes

#### ✨ Features

- **pamenv:** 支持 PAMENV_ENABLED 强制关闭注入与解封 ([25d45e0](https://github.com/qlover/brain-toolkit/commit/25d45e06e7a65c7543d8726238ade50ff36c29e9)) ([#208](https://github.com/qlover/brain-toolkit/pull/208))

  设为 0/false/off/no 时插件不 OIDC、createPamenv 返回空袋，
  便于回填平台变量后用普通 build 恢复线上。

- **pamenv-next:** 新增 createPamenv 与 Next 插件运行时解封 ([363614c](https://github.com/qlover/brain-toolkit/commit/363614c846e4b11a9a047a81dbc4b9c51b2eda82)) ([#203](https://github.com/qlover/brain-toolkit/pull/203))

  插件负责 build/dev 注入与密封快照；createPamenv 供 Node 入口解封，Edge 库内 no-op。

#### 🐞 Bug Fixes

- **brain-oauth:** 静默 pamenv 动态 cwd 的 Turbopack NFT 告警 ([8b51b24](https://github.com/qlover/brain-toolkit/commit/8b51b24383863d947ac53df2a34e2480ba9f9dbf)) ([#212](https://github.com/qlover/brain-toolkit/pull/212))

  pamenv-next 对 process.cwd 加 turbopackIgnore 并固定 .pam；
  应用 next.config 按路径忽略 Dynamic filesystem / NFT list。

## 1.1.0

### Minor Changes

#### ✨ Features

- **pamenv:** monorepo .pam 复用、默认域名与 projects 表格分页 ([a770e9d](https://github.com/qlover/brain-toolkit/commit/a770e9d4413d491abd1959d0bb2d509fbc2bd815)) ([#199](https://github.com/qlover/brain-toolkit/pull/199))
  - 向上查找最近项目 .pam（最多 32 层、遇 .git 停止；跳过 ~/.pam）
  - 登录默认 https://pam.qlover.top，仅参数/config 覆盖
  - projects 对齐表格（-v 显示 ID）并打印分页摘要

## 1.0.0

### Major Changes

#### ✨ Features

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

## 0.1.0

### Minor Changes

- First release: `createPamenvPlugin` injects PAM env before Next reads config (`debug`, `envPriority`).
