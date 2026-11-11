# @pamenv/vite

## 1.3.0

### Minor Changes

#### ✨ Features

- **pamenv-vite:** 对齐 next 的 enabled/dev/ci/oidc 注入时机 ([9eb1954](https://github.com/qlover/brain-toolkit/commit/9eb1954a3bedc3de4506b24dca1d6cbef98da763)) ([#214](https://github.com/qlover/brain-toolkit/pull/214))

  GitHub Actions vite build 可 OIDC 注入；示例复用 pamenv-ci-smoke；
  扩展 smoke workflow 增加 vite job。

- **pamenv-vite:** 对齐 PAM_ENV 与运行时解封约定 ([0d80a8f](https://github.com/qlover/brain-toolkit/commit/0d80a8f15ece9060b926f3f346ce2cc12f2e4eb4)) ([#203](https://github.com/qlover/brain-toolkit/pull/203))

## 1.2.0

### Minor Changes

- 对齐 `@pamenv/next`：`enabled` / `dev` / `ci` / `oidc` 自动时机；去掉 `enabled` 函数形态
- 匹配 CI 的 `vite build` 可 OIDC 注入，并默认写出 `.pam/deploy-snapshot.json`

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

- First release: Vite plugin injects PAM env in an early `config` hook (`debug`, `envPriority`).
