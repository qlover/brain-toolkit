# next-oauth / PAM 角色 · 权限（uid）· 团队

> **分支：** `feat/role-system`  
> **权限主键：** 不可变 API `uid` = `{method}_{path模板}`  
> **机构 = `pam_role_teams`**；项目通过 `pam_projects.team_id` 挂到团队  
> **角色相关表统一 `pam_role_*` 前缀**

---

## 0. 产品定论

| 点 | 决定 |
| --- | --- |
| 权限标识 | `permissionUid(METHOD, API_*)` → uid；FE/BE `includes(uid)` |
| uid | 生成后不可改、不可重复；表 PK = uid（鉴权） |
| slug | `permissionSlug(uid)`；i18n key = `permission:{slug}`；UI 展示翻译 |
| description | 仅 DB 备注/查询；页面不用 |
| 系统角色 | `pam_users.system_role`：user / operator / admin |
| 机构角色 | `pam_role_team_members.role`：owner / admin / member |
| 项目 | **不再等于机构**；归属 `team_id` |
| 协作者表 | `pam_project_collaborators` **保留**；有 `team_id` 时以团队成员为准 |

```
平台
 └─ system_role → pam_role_assignments(system) → uid[]

团队（机构）
 └─ pam_role_team_members.role → pam_role_assignments(org) → uid[]
      └─ pam_projects.team_id → pam_role_teams
```

---

## 1. 用户 ↔ 角色绑定

| 范围 | 绑定位置 |
| --- | --- |
| 系统 | `pam_users.system_role` |
| 团队 | `pam_role_team_members (team_id, user_id, role)` |
| 项目访问 | 若 `project.team_id` 有值 → 团队角色；否则回落 owner + collaborators |

角色 → 权限：只查 `pam_role_assignments`。

---

## 2. 表（`pam_role_*`）

| 表 | 作用 |
| --- | --- |
| `pam_role_permissions` | 权限目录（uid / type / method / path） |
| `pam_role_assignments` | scope + role_key → permission_uid |
| `pam_role_teams` | 团队 / 机构 |
| `pam_role_team_members` | 团队成员与角色 |

**回填（022）**：按项目 owner 建 `personal-{userId}` 团队；挂项目；并入协作者。

---

## 3. API

| Method | Path | 说明 |
| --- | --- | --- |
| GET/POST | `/api/pam/teams` | 列表 / 创建 |
| GET | `/api/pam/teams/:teamId` | 详情 |
| POST | `.../members` | 加人 |
| PATCH/DELETE | `.../members/:userId` | 改角色 / 移除 |
| POST | `.../projects` | 挂项目 |
| PATCH | `/api/admin/users/:userId/system-role` | 设系统角色 `user\|operator\|admin` |
| GET | `/api/admin/roles` | 权限目录 + 角色授权视图 |
| PATCH | `/api/admin/roles` | 替换某角色的 permission uid 列表 |

后台：
- **用户管理** `/admin/users`：给用户绑定 `system_role`
- **角色管理** `/admin/roles`：编辑 `pam_role_assignments`（系统角色 + 机构角色 → uid）

---

*机构 = pam_role_teams；权限目录 = pam_role_permissions；授权 = pam_role_assignments。*
