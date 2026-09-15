# next-oauth / PAM 角色 · 权限（uid）· 团队

> **分支：** `feat/role-system`（角色相关为**重写**，不以「只加列」保留旧字段）  
> **权限：** `uid` = `{method}_{path}`；展示用 `slug` → `permission:{slug}`  
> **角色：** 扁平 `pam_roles` + **`role_id` only**  
> **团队：** `pam_role_teams` / members 绑 `role_id`

---

## 定论

| 概念 | 含义 |
| --- | --- |
| `pam_roles` | 角色模板：`key` / `kind=platform\|team` |
| `pam_role_assignments` | **仅** `(role_id, permission_uid)` |
| `pam_users.role_id` | 平台角色（**无** `system_role`）。**不管自己的项目。** |
| `pam_role_team_members.role_id` | 团队内角色。自己的项目走 **团队所有者**（创建时挂个人团队 / `owner_id`） |
| 团队名 | 用户自取（团队1/2/3…），只是容器 |

种子角色按 `pam_roles.key` 插入（`user` / `operator` / `admin` / `team_*`）；`role_id` 运行时由 key 解析，代码不写死 UUID。

API 仍可用 `owner|admin|member`、`user|operator|admin`，服务端映射到 `role_id`。

---

## SQL

只跑一份：**`apps/pam/makes/sql/020-pam-roles.sql`**（角色 / 权限 / 团队 / `pam_users.role_id` 全在里面，可重跑）。
