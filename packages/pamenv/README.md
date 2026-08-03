# pamenv

本地多环境 env 同步工具：从 PAM `pull` 到当前目录，本地改完再 `push` 回去。

## 安装

```bash
npm install -g pamenv
# 或
npx pamenv --help

# monorepo
pnpm --filter pamenv build
pnpm --filter pamenv link --global
pnpm pamenv --help
```

## 常用命令

```bash
pnpm pamenv login
pnpm pamenv projects
pnpm pamenv pull <slug|id>                 # → ./.env.<环境名>
pnpm pamenv pull <slug|id> -e staging
pnpm pamenv pull <slug|id> -e staging -f   # 仅跳过「覆盖本地」冲突确认
pnpm pamenv push <slug|id> -e staging      # diff + 同步冲突检测后回写
pnpm pamenv push <slug|id> -e staging -y   # 跳过普通确认（不含冲突覆盖）
pnpm pamenv push <slug|id> -e staging -f   # 仅跳过同步冲突覆盖确认（不等于 -y）
pnpm pamenv push <slug|id> -e staging --show-values  # review 显示非敏感明文
pnpm pamenv logout
```

本地文件：`.env.<环境名>`。未传 `-e` 时用环境列表**第一个**。

`pull` 会尽量保留本地注释；语义内容不同时交互选择覆盖/取消。  
`push` 用 `~/.pam/sync` 基线做三方比较（可发现 Web 端修改）：仅远端变更会提示先 pull；双方都改则冲突交互。

**Flags：** `-f` 只跳过冲突覆盖确认；`-y` 跳过普通确认（无基线、最终 push、新 key 敏感标记）。两者互不隐含。  
**Diff：** 默认全部打码为 `*****`；`--show-values` 仅明文显示非敏感（含名称启发式，如 `*_SECRET` / `*_TOKEN`）。

敏感标记：`# pam:sensitive`（可紧挨变量上方，中间可夹注释）。变量上方注释与行尾注释会随文件保留。

```bash
# DB password
# pam:sensitive
API_TOKEN=xxxx # production only
NORMAL=1
```

本地状态：`~/.pam/config.json`（登录，`0600`）+ `~/.pam/sync/<projectId>/<env>.json`（同步基线，`0600`）。  
`pull` / `push` 写出的 `.env.<env>` 同样按 `0600` 落盘（POSIX；Windows 权限模型有限）。  
`pamenv logout` 会先请求服务端吊销当前 Token，再清除本地 token，并删除整个 `~/.pam/sync`。  
CLI Token 默认 **30d**（`PAM_CLI_TOKEN_EXPIRES_IN` 可改，如 `21d`），带 `jti` 登记，可服务端吊销；旧版无 `jti` 的 Token 将失效，需重新 `login`。
