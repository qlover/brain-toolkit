# pamenv-vite-app

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
