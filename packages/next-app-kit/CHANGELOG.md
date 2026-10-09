# @brain-toolkit/next-app-kit

## 0.1.0

### Minor Changes

#### ✨ Features

- **next-app-kit:** 新增公共包并迁移 pam ([8d68816](https://github.com/qlover/brain-toolkit/commit/8d6881642b4b9d16265dd282c3756b650b89a72f)) ([#169](https://github.com/qlover/brain-toolkit/pull/169))

  squash 自 split/01-next-app-kit-pam：
  - feat(next-app-kit): 新增公共包，迁入 PAM 通用工具与组件
  - feat(pam): Brain 登录改用身份关联表，不再以 sub 作为用户 id
  - fix(next-app-kit): 个人请求日志仅返回当前用户的记录

- **next-app-kit:** 权限、授权记忆、站点设置与 CORS 入包 ([39ad235](https://github.com/qlover/brain-toolkit/commit/39ad2350fe059127c87679ea21b31524f6f2c00e)) ([#169](https://github.com/qlover/brain-toolkit/pull/169))

  squash 自 split/03-next-app-kit-settings-perms：
  - feat(next-app-kit): 权限体系入包，brain-oauth 后台按 Brain 管理员放行
  - feat(next-app-kit): 按设备记住授权与授权页账号切换入包，同步 brain-oauth
  - feat(next-app-kit): 站点设置与 CORS 入包，brain-oauth 支持后台配置 CORS

- **next-app-kit:** 新增公共包并迁移 pam ([8d68816](https://github.com/qlover/brain-toolkit/commit/8d6881642b4b9d16265dd282c3756b650b89a72f)) ([#169](https://github.com/qlover/brain-toolkit/pull/169))

  squash 自 split/01-next-app-kit-pam：
  - feat(next-app-kit): 新增公共包，迁入 PAM 通用工具与组件
  - feat(pam): Brain 登录改用身份关联表，不再以 sub 作为用户 id
  - fix(next-app-kit): 个人请求日志仅返回当前用户的记录

- **next-app-kit:** 权限、授权记忆、站点设置与 CORS 入包 ([39ad235](https://github.com/qlover/brain-toolkit/commit/39ad2350fe059127c87679ea21b31524f6f2c00e)) ([#169](https://github.com/qlover/brain-toolkit/pull/169))

  squash 自 split/03-next-app-kit-settings-perms：
  - feat(next-app-kit): 权限体系入包，brain-oauth 后台按 Brain 管理员放行
  - feat(next-app-kit): 按设备记住授权与授权页账号切换入包，同步 brain-oauth
  - feat(next-app-kit): 站点设置与 CORS 入包，brain-oauth 支持后台配置 CORS

#### 🐞 Bug Fixes

- **next-app-kit:** 登录审计日志改用 service-role 写入 ([06d95a5](https://github.com/qlover/brain-toolkit/commit/06d95a59bf2aacba06cdf7a6ca99df07530f0c45)) ([#170](https://github.com/qlover/brain-toolkit/pull/170))

  user_id 写入后，cookie 客户端受 RLS 限制（user_id = auth.uid()），
  Brain 等非 Supabase 会话下 auth.uid() 为空，登录 / 退出会因写日志失败而报错。

- **next-app-kit:** 清空的角色权限不再回退默认值，CORS 缓存加 TTL ([b430d18](https://github.com/qlover/brain-toolkit/commit/b430d1807142deebca61a4f9aec7a0803454f942)) ([#170](https://github.com/qlover/brain-toolkit/pull/170))
  - 加载角色权限时为 DB 中无分配的角色写入空数组，避免清空后回退到
    代码默认权限；分配表为空时也标记已加载，不再每次请求都查库
  - getOrSet 被 removeItem/setItem 打断后不再回写旧结果，修复失效后
    旧 CORS 配置覆盖新值的竞态
  - CORS 配置缓存增加 TTL（默认同 snapshot 60s），多进程下最终一致

- 修复代码审查发现的 4 个高危问题 ([9f68724](https://github.com/qlover/brain-toolkit/commit/9f687248862cfb01a7569a32d5941e4da74a74d7)) ([#169](https://github.com/qlover/brain-toolkit/pull/169))
  - fix(next-app-kit): 登录审计日志改用 service-role 写入

  user_id 写入后，cookie 客户端受 RLS 限制（user_id = auth.uid()），
  Brain 等非 Supabase 会话下 auth.uid() 为空，登录 / 退出会因写日志失败而报错。
  - fix(brain-oauth): 登录后跳转只允许同源地址

  returnTo 原样跳转，?redirect=https://外站 登录成功后会跳出站点；
  非同源地址改为回落到开发者控制台。
  - fix(brain-oauth): 管理员权限限定在指定 Brain 环境

  登录环境可选后，任一环境（如 development）的 Brain admin 都能进入
  本站后台。新增 BRAIN_ADMIN_ENVS，仅在这些环境（默认为配置的默认
  环境）保留 admin 角色，其余环境降级为普通用户。
  - fix(next-app-kit): 清空的角色权限不再回退默认值，CORS 缓存加 TTL
  * 加载角色权限时为 DB 中无分配的角色写入空数组，避免清空后回退到
    代码默认权限；分配表为空时也标记已加载，不再每次请求都查库
  * getOrSet 被 removeItem/setItem 打断后不再回写旧结果，修复失效后
    旧 CORS 配置覆盖新值的竞态
  * CORS 配置缓存增加 TTL（默认同 snapshot 60s），多进程下最终一致

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

- 修复代码审查发现的 4 个高危问题 ([9f68724](https://github.com/qlover/brain-toolkit/commit/9f687248862cfb01a7569a32d5941e4da74a74d7)) ([#169](https://github.com/qlover/brain-toolkit/pull/169))
  - fix(next-app-kit): 登录审计日志改用 service-role 写入

  user_id 写入后，cookie 客户端受 RLS 限制（user_id = auth.uid()），
  Brain 等非 Supabase 会话下 auth.uid() 为空，登录 / 退出会因写日志失败而报错。
  - fix(brain-oauth): 登录后跳转只允许同源地址

  returnTo 原样跳转，?redirect=https://外站 登录成功后会跳出站点；
  非同源地址改为回落到开发者控制台。
  - fix(brain-oauth): 管理员权限限定在指定 Brain 环境

  登录环境可选后，任一环境（如 development）的 Brain admin 都能进入
  本站后台。新增 BRAIN_ADMIN_ENVS，仅在这些环境（默认为配置的默认
  环境）保留 admin 角色，其余环境降级为普通用户。
  - fix(next-app-kit): 清空的角色权限不再回退默认值，CORS 缓存加 TTL
  * 加载角色权限时为 DB 中无分配的角色写入空数组，避免清空后回退到
    代码默认权限；分配表为空时也标记已加载，不再每次请求都查库
  * getOrSet 被 removeItem/setItem 打断后不再回写旧结果，修复失效后
    旧 CORS 配置覆盖新值的竞态
  * CORS 配置缓存增加 TTL（默认同 snapshot 60s），多进程下最终一致

  ***

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>
