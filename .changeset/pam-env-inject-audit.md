---
'@brain-toolkit/pam': minor
---

环境变量按「能用」与「能看」区分权限：

- 新增权限 `pam_environments_inject` 与 `POST /api/pam/:projectId/environments/:envId/resolve`，供 `pamenv run` 获取变量。
- `pam_environments_export`（pull / render 明文）收紧为 team_admin / team_owner。
- 环境新增「受保护」开关：受保护环境只有 admin / owner 能 `run`。
- 新增 `pam_env_access_logs`，记录每次 resolve / export（不记录键值），环境页可查看访问记录。
- 需要执行 `makes/sql/001-pam-upgrade.sql` 第 8 节。
