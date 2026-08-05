# pamenv-cli

Sync PAM multi-environment variables locally: interactive `init` creates a project from the current directory, then `pull` / `push` sync `.env.<environment>` files. The installed command is `pamenv`.

## Install

```bash
npm install -g pamenv-cli
# or
npx pamenv --help

# monorepo
pnpm --filter pamenv-cli build
pnpm pamenv --help
```

After changing CLI source, run `pnpm --filter pamenv-cli build` so `pnpm pamenv` picks up the new `dist`.

## Commands

```bash
pamenv login
pamenv projects
pamenv init                       # interactive create (scans cwd)
pamenv init -o ./packages/app
pamenv fork <slug|id>             # fork readable project (secrets cleared)
pamenv fork <slug|id> -y
pamenv pull <slug|id> -e staging
pamenv pull <slug|id> -e staging -f
pamenv push <slug|id> -e staging
pamenv push <slug|id> -e staging -y
pamenv push <slug|id> -e staging -f
pamenv push <slug|id> -e staging --show-values
pamenv remove <slug|id> -e local   # delete remote env (two confirms)
pamenv remove <slug|id> -e local -y
pamenv logout
```

Local files are `.env.<environment>` (e.g. env `local` → `.env.local`). Without `-e`, the first environment in the list is used (`remove` always requires `-e`).

---

## `pamenv init`

Run after login in your project directory (npm-init style). The CLI scans the cwd for defaults; you confirm before create.

```bash
pamenv login
cd your-project
pamenv init
```

### Defaults from scan

| Field              | When available                                                         | Otherwise                         |
| ------------------ | ---------------------------------------------------------------------- | --------------------------------- |
| **name**           | `package.json` `name`, else git `origin` repo name (last path segment) | typed by you                      |
| **slug**           | derived from the confirmed **name** (`@scope/foo` → `scope-foo`)       | no default if conversion is empty |
| **description**    | `package.json` `description`                                           | optional empty                    |
| **category**       | —                                                                      | `后端` / `前端` (default backend) |
| **repository url** | git `origin` (normalized to https when possible)                       | optional empty                    |
| **environments**   | see below                                                              | may create none                   |

### Environments

1. Scan `.env`, `.env.local`, `.env.<xxx>` (non-recursive).
2. Naming:
   - `.env` / `.env.local` → env name **`local`** (merged)
   - `.env.xxx` → env name **`xxx`**
3. **If env files exist**: multi-select envs, then confirm **env name** and **env url** for each.  
   Default url prefers `package.json` **homepage** (valid http/https); otherwise you must enter one (API requires a valid URL).
4. **If no env files**: no environments are created (homepage alone does not create an env).
5. `init` creates the project (and empty envs only). Upload values with:

```bash
pamenv push <slug> -e local
```

### Slug rules

- Globally unique among **non-deleted** projects; soft-delete frees the slug for reuse.
- If the slug exists and you own it: CLI stops and tells you to `push`.
- If taken by someone else: pick another slug and run `init` again.

### Typical flow

```text
login → init → edit .env.* → push → pull / push thereafter
```

---

## `pamenv fork`

Fork a readable project (yours or public) into a private copy. **Sensitive values are cleared**; structure and non-sensitive values are copied.

```bash
pamenv fork <slug|id>
pamenv fork <slug|id> --slug my-app-fork --name "My App (fork)"
pamenv fork <slug|id> -y
```

Then fill secrets with `pamenv push <new-slug> -e <env>`.

---

## Pull / Push

`-f` only skips conflict overwrite prompts. `-y` skips ordinary confirms (not conflict overwrite). Diff review masks all values by default; `--show-values` shows non-sensitive plaintext.

If `-e` names an environment that does not exist, the CLI collects a URL and runs local validation/confirmation first, then **creates the environment and uploads variables together** (no empty env is created early). With `-y`, it defers create when a default URL is available; otherwise it errors.

`pamenv remove <slug> -e <env>` deletes a remote environment (owner only) with two confirmation prompts (`-y` skips them). It clears the matching `~/.pam/sync` baseline and does not delete local `.env.*` files.

Mark secrets with `# pam:sensitive` above the key. Header and inline comments are preserved.

---

## Auth and permissions

Auth/sync/`.env.*` use mode `0600` on POSIX. `pamenv logout` revokes the server token then clears local auth and `~/.pam/sync`. CLI tokens last **30d** by default (`PAM_CLI_TOKEN_EXPIRES_IN`, e.g. `21d`) and are revocable via `jti`. Decrypted export and `push` are owner-only.
