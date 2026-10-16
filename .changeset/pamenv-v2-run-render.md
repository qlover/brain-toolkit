---
'pamenv-cli': minor
---

新增 `pamenv run` 与 `pamenv render`：

- `run`：把环境变量注入子进程并运行命令，不写文件、不打印值；支持 `--only`、`--keep-env`，转发 `SIGINT` / `SIGTERM`，退出码与子进程一致。启动前检查同名 `.env*` 文件、带 `NEXT_PUBLIC_` / `VITE_` 前缀的敏感变量和 turbo 严格环境变量模式（`--no-warn` 关闭）。
- `render`：按 `dotenv` / `json` / `yaml` / `toml` 输出，默认到 stdout，`--out` 写入 0600 文件。
- `pull` / `render` 改为检查导出权限（项目 admin / owner），成员请改用 `run`。
- `--local` 的提示改为输出到 stderr。
