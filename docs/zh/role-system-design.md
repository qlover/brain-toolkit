# PAM 角色 · 权限（permission_key）· 团队

> **集成支：** `feat/pam-roles-teams`  
> **权限身份：** 不可变 `permission_key`（DB / session / UI / i18n 唯一主键）  
> **角色：** 扁平 `pam_roles` + `role_id`（平台绑用户，团队绑成员）  
> **项目访问：** 只认 `pam_projects.team_id` 成员（及 `owner_id`）；**无项目写作者**

---

## 定论

| 概念 | 含义 |
| --- | --- |
| `pam_roles` | 角色模板：`key` / `kind=platform\|team` |
| `pam_role_assignments` | `(role_id, permission_key)` |
| `pam_role_permissions` | 权限目录：`permission_key` + 可选 method/path 元数据 |
| `pam_users.role_id` | 平台角色（`user` / `operator` / `admin`）。**不管项目内读写。** |
| session `system_role` | 由平台 `role_id` → key 解析后的展示/兼容字段 |
| `pam_role_team_members.role_id` | 团队内角色。项目权限由此（及是否 `owner_id`）决定 |
| 个人团队 | 创建项目时挂 `personal-{userId}`；解散团队时项目回各 `owner_id` 的个人团队 |

种子角色按 `pam_roles.key` 插入（`user` / `operator` / `admin` / `team_owner` / `team_admin` / `team_member`）；运行时按 key 解析 id，代码不写死 UUID。

API 仍可用遗留文案 `owner|admin|member`（映射到 `team_*`）。

---

## 项目权限要点

- 访问：`owner_id === 当前用户` **或** 项目 `team_id` 下活跃成员
- `is_owner`：**仅**表示 `owner_id`（不是「团队 owner 角色」）
- **转让 / 删除项目**：仅项目拥有者（`owner_id`）；`pam_project_transfer` / `pam_project_delete` 只授给 owner 级角色，服务端仍校验 `owner_id`
- 环境读写等：按团队角色展开的 `permissions[]`（如 `pam_environments_*`、`pam_project_edit`）

---

## SQL

1. **`apps/pam/makes/sql/020-pam-roles.sql`** — 角色 / 权限目录 / 赋值 / 团队表 / `pam_users.role_id`（可重跑）
2. **`apps/pam/makes/sql/021-pam-projects-backfill-team-id.sql`** — 历史项目补 `team_id`
3. **`apps/pam/makes/sql/022-pam-search-projects-team.sql`** — `pam_search_projects` 私有可见性改为团队成员（不再用写作者表）

---

## 相关面

- Web：后台角色/权限目录；团队列表与详情；General 转让/删除危险区
- CLI（`pamenv`）：仍用项目 search/detail 上的 `can_edit` / `my_role` / `permissions`；团队管理在 Web
