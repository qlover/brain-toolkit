# pamenv-cli

`pamenv` uses and manages PAM multi-environment variables:

- For day-to-day development, `pamenv run` injects variables straight into a command's process, so no plaintext file stays on disk.
- When you need a file, `pamenv render` outputs dotenv / JSON / YAML / TOML, and `pull` / `push` sync with `.env.<environment>` files.
- **Sensitive values only reach a process through `run`**; the web UI, `render` and `pull` never return them in plaintext (see "Marking sensitive variables").
- `init` creates a project from the current directory.

## Install

```bash
npm install -g pamenv-cli
# or run once
npx pamenv --help
```

## Quick start

```bash
pamenv login                      # sign in via the browser
cd your-project
pamenv init                       # create a project interactively (defaults from the cwd)
pamenv push <slug> -e local       # upload .env.local
pamenv run <slug> -e local -- pnpm dev   # start with variables injected, no files written
pamenv pull <slug> -e staging     # download into .env.staging (export permission)
```

## Commands

| Command | Description |
| --- | --- |
| `pamenv login` | Sign in through the browser |
| `pamenv logout` | Sign out and revoke the current CLI credential |
| `pamenv projects` | List projects (compact: slug / name / role / envs / id) |
| `pamenv init` | Create a project interactively |
| `pamenv fork <slug\|id>` | Fork a readable project into your own private project |
| `pamenv run <slug\|id> -- <command>` | Run a command with variables injected into its process; no files written |
| `pamenv render <slug\|id>` | Output variables as dotenv / json / yaml / toml |
| `pamenv pull <slug\|id>` | Write remote variables into a local file |
| `pamenv push <slug\|id>` | Push variables from a local file to PAM |
| `pamenv remove <slug\|id> -e <env>` | Delete a remote environment |
| `pamenv config set\|list` | View or change CLI settings |

`<slug|id>` accepts either the project slug or the project id.

### Global options

| Option | Description |
| --- | --- |
| `--url <url>` | PAM origin, e.g. `https://pam.example.com` |
| `--domain <host>` | Same as `--url` but accepts a bare host; `localhost` and private addresses default to `http`, others to `https` |
| `--local` | Force cwd `.pam/`; if `.pam/` exists it auto-isolates (never reads `~/.pam`) |
| `-g, --global` | Force `~/.pam` even when cwd already has `.pam/` |

Do not pass `--url` and `--domain` together, or `--local` and `--global` together. Add `.pam/` to `.gitignore`.

```bash
pamenv --domain pam.localhost:3400 login
pamenv --local --domain pam.localhost:3400 login   # first write to cwd/.pam
pamenv projects                                   # with .pam/, local only (fails if not logged in locally)
pamenv -g projects                                # force global sign-in
```

## `pamenv projects`

Lists projects visible to the current identity. Uses the same `GET /api/pam/search` as the web home list; **CLI prints one compact row** (slug / name / role / envs / id) — not web card fields like description, category, or timestamps.

Role column: `owner` · `admin` · `member` · `member, writable` · `readonly`.

```bash
pamenv projects
pamenv projects fe
pamenv projects --visibility private
pamenv projects --category frontend --sort updated_at --order desc
pamenv projects --mine
pamenv projects --writable
pamenv projects --page 2
pamenv projects fe --writable --page 1 --page-size 20
```

| Option | Wire param | Description |
| --- | --- | --- |
| `[keyword]` | `keyword` | Optional search keyword (slug / name; compact view skips card text fields) |
| `--category <name>` | `filters.category` | Filter by category (same as Web) |
| `--visibility <public\|private>` | `filters.visibility` | Visibility; omit for the default “all visible” scope (public + owned / team) |
| `--sort <created_at\|updated_at>` | `sort` | Sort field (server still sorts `is_public` first) |
| `--order <asc\|desc>` | `sort` | Sort direction, default `desc` |
| `--page <n>` | `page` | 1-based page, default `1`; pass `--page` for more |
| `--page-size <n>` | `pageSize` | Page size, **default `10` (same as Web)**, max `100` |
| `--mine` | `filters.mine` | **Server-side**: strict project owner (`owner_id = me`) |
| `--writable` | `filters.writable` | **Server-side**: owner or active team member; with `--mine` → intersection |
| (fixed) | `view=compact` | CLI compact payload (id/slug/name/envs/…); web cards use `full` (default) |

Also accepts global options: `--url` / `--domain` / `--local` / `-g`.

- `--mine` / `--writable` are applied in SQL before pagination (correct totals — not post-filter).
- Pagination follows `--page` / `--page-size` exactly (same as Web).

## Testing

```bash
# Default: unit + mock contract integration (no PAM account)
pnpm --filter pamenv-cli test

# Optional: live PAM (dedicated harness project + tokens; never commit secrets)
PAMENV_LIVE=1 \
PAMENV_BASE_URL=https://pam.example.com \
PAMENV_OWNER_TOKEN=... \
PAMENV_MEMBER_TOKEN=... \
PAMENV_PROJECT_SLUG=ci-pamenv-harness \
PAMENV_ENV_NAME=dev \
PAMENV_PROTECTED_ENV_NAME=secret \
pnpm --filter pamenv-cli test:live
```

Contract tests (~78) use an in-memory mock PAM covering identity / exact slug / `-o`, pull (403/401/leaks/multi-env/`--file`), bindings + `--force` TTY, run (403/protected/404 fallback/slug mismatch/keepEnv/warnings), pull/push three-way sync and conflicts, render (yaml/toml/`--only`), remove (clears snapshot), and over-permissive files.

## Security model

- **Identity isolation:** if cwd has `.pam/`, only local credentials are used — never fall back to `~/.pam`. Missing token fails immediately. Use `-g` for the home root.
- **Exact project:** `pull` / `push` / `run` / `render` / `remove` / `fork` accept an **exact** slug or uuid only (no substring match like `pam` → `pamenv-…`).
- **Fail-closed permissions:** trust server `permissions[]`; on missing permission or 401/403 there is no disk write and no injection. CLI checks are not a substitute for server auth.
- **pull ≠ run:** `pull` / `render` need `pam_environments_export` (admin+); sensitive values are placeholders. `run` needs `pam_environments_inject` (member+); plaintext stays in the child process only.
- **Protected envs:** with `is_protected=true`, both resolve and variable writes require export-tier permission — members cannot `run`, `push`, or edit that environment in the web UI.
- **On disk:** refuses to overwrite files readable by group/others; writes are atomic + `0600`. On Windows, the current user is granted access and Everyone / Users entries are removed (best-effort). `--force` rebind requires interactive confirmation (non-TTY is refused).

## Environments and local files

- `-e <env>` selects the environment: `-e local` maps to `.env.local`, `-e staging` to `.env.staging`.
- Without `-e`, the project's first environment is used (`remove` always requires `-e`).
- `--file <path>` uses another file, relative to the current directory (or `-o`), or an absolute path.
- **Multiple projects in one cwd:** the default filename is only the env name. After `pull fe-base -e dev` (owns `.env.dev`), `pull pam -e dev` is refused — use `--file .env.pam.dev`, another directory, or `--force` in a TTY with confirmation.

```bash
pamenv pull <slug> -e local --file .env   # write .env instead of .env.local
pamenv push <slug> -e local --file .env   # read .env and push to local
pamenv pull pam -e dev --file .env.pam.dev
```

## `pamenv init`

Run it in your project directory after signing in, similar to `npm init`: the CLI scans the directory for defaults and only creates the project after you confirm.

```bash
pamenv init
pamenv init -o ./packages/app     # use another working directory
```

### Defaults

| Field | Default | Otherwise |
| --- | --- | --- |
| **name** | `package.json` `name`, else the git `origin` repo name | typed by you |
| **slug** | derived from the confirmed name (lowercase, `@scope/foo` → `scope-foo`) | typed by you |
| **description** | `package.json` `description` | may be empty |
| **category** | — | choose backend or frontend (default backend) |
| **repository url** | git `origin` (normalized to https when possible) | may be empty |
| **environments** | see below | may create none |

### Environment detection

1. Scans `.env`, `.env.local` and `.env.<xxx>` in the directory (not recursive).
2. `.env` and `.env.local` merge into environment **`local`**; `.env.xxx` becomes environment **`xxx`**.
3. When env files exist, pick the environments to create and confirm each name and URL. The URL defaults to `package.json` `homepage`; otherwise enter a valid http/https URL.
4. With no env files, no environments are created.
5. `init` only creates the project and empty environments. **It does not upload variables.** Afterwards run:

```bash
pamenv push <slug> -e local
```

### Slug rules

- Slugs are unique among non-deleted projects; a deleted project's slug can be reused.
- If the slug exists and belongs to you, the CLI tells you to `push` instead.
- If someone else owns it, choose another slug and run `init` again.

## `pamenv fork`

Copies a project you can read (yours or public) into a private project. Structure and non-sensitive values are copied; **sensitive values are cleared**.

```bash
pamenv fork <slug|id>
pamenv fork <slug|id> --slug my-app-fork --name "My App (fork)"
pamenv fork <slug|id> -y          # accept the default slug / name without prompts
```

Then fill in secrets with `pamenv push <new-slug> -e <env>`.

## `pamenv run`

Runs a command with environment variables injected into its process. Values only live in the memory of pamenv and the child process: nothing is written to disk and the CLI never prints values.

**Plaintext boundary:** Sensitive values are real plaintext in the child process environment. The CLI guarantees no disk writes and no printing; it cannot stop the launched app from logging secrets, another local process from reading that process's env, or a debugger attach. Do not print secrets in your app; prefer `--only` to narrow the injection surface in production-like runs.

```bash
pamenv run <slug|id> -e local -- pnpm dev
pamenv run <slug|id> -e local --only DATABASE_URL,API_KEY -- node server.js
pamenv run <slug|id> -e local --keep-env PORT -- pnpm dev
```

| Option | Description |
| --- | --- |
| `-e, --env <name>` | Environment name (default: first) |
| `--only <keys>` | Only inject these keys (comma-separated) |
| `--keep-env <keys>` | Keep the shell's value for these keys when already set |
| `--no-warn` | Disable the pre-run checks |
| `--env-priority <remote\|local>` | Overlap priority: `remote` (default, PAM wins) \| `local` (process → on-disk `.env*` → PAM, for temporary local overrides) |
| `--client-public-prefixes <list>` | Prefixes for the sensitive client-bundle warning (comma-separated; built-in default); pass empty to disable |

Programmatic inject (`injectPamenvProcessEnv` / `@pamenv/next` / `@pamenv/vite`) also accepts:

- `debug` (default `false`): quiet by default — no “Using local config…”, inject count, key names, `baseUrl` / `.pam` root. When `true`, those metadata lines go to stderr (**never values**). CLI `pamenv run` stays verbose.
- `envPriority`: same as `--env-priority`; default `remote`. Use `local` for local overrides (process → `.env*` → PAM). Sensitive placeholders resolve to PAM plaintext; remote-sensitive + local plaintext warns but does not block.

- Everything after `--` goes to the child unchanged, including the child's own options.
- PAM wins for keys that also exist in the shell (except `--keep-env` keys).
- Signals such as `Ctrl+C` are forwarded to the child, and pamenv exits with the child's exit code.
- Put it in `package.json` so teammates need no `.env` file:

```json
{
  "scripts": {
    "dev": "pamenv run my-app -e local -- next dev"
  }
}
```

Before starting, pamenv checks for the following and warns on stderr (it never blocks):

| Check | Why |
| --- | --- |
| A `.env*` file in the cwd defines the same key | If dotenv loads it with `override`, the file value wins over the injected one |
| A sensitive key starts with `NEXT_PUBLIC_` / `VITE_` | It gets bundled into client code at build time |
| `turbo.json` uses strict env mode and the key is not declared | Turbo filters undeclared variables |

If an environment is marked **protected** in the web UI, only project admins / owners can `run` it or change its variables (including `push`).

## `pamenv render`

Outputs variables in the chosen format, to stdout by default; requires export permission (project admin / owner). Sensitive values are output as this environment's placeholder (`__PAM_SENSITIVE_…__`) and their key names are listed on stderr; real values only reach a process via `pamenv run`.

```bash
pamenv render <slug|id> -e dev                              # dotenv to stdout
pamenv render <slug|id> -e dev --format json
pamenv render <slug|id> -e dev --format toml --out config.toml
pamenv render <slug|id> -e dev --out .env.local --only API_URL,API_KEY
```

| Option | Description |
| --- | --- |
| `--format <format>` | `dotenv` (default; keeps comments), `json`, `yaml`, `toml`; the last three are flat key/values with double-quoted, escaped values |
| `--out <file>` | Write to a file (mode 0600); omit or use `-` for stdout |
| `--only <keys>` | Only output these keys |

## `pamenv pull` / `pamenv push`

```bash
pamenv pull <slug|id> -e staging
pamenv pull <slug|id> -e staging -f            # conflicting keys take remote values without asking
pamenv push <slug|id> -e staging
pamenv push <slug|id> -e staging -y            # skip ordinary confirmations
pamenv push <slug|id> -e staging -f            # conflicting keys take local values without asking
pamenv push <slug|id> -e staging --show-values # show non-sensitive values in the preview
pamenv push <slug|id> -e staging JWT_SECRET=new…   # inline override on top of the local file
pamenv push <slug|id> -e staging --unset OLD_KEY   # delete keys (local lines removed after success)
```

- `pull` requires export permission (project admin / owner). **Already-sensitive** keys are written with `# pam:sensitive` and this environment's placeholder `__PAM_SENSITIVE_…__` (different per environment); leftover local plaintext for those keys is replaced. Unmarked keys (even names like `DATABASE_URL`) stay as plain values. If the server sends no placeholder, sensitive keys are kept with an empty value (empty on push means keep). Prefer `pamenv run` for development.
- **File push = full desired state**: a missing key in the file means delete it remotely; push does not auto-pad sensitive keys back in.
- On `push`, a placeholder (or an empty value) for an already-sensitive key means "keep the PAM value"; a new value rotates it. New unmarked keys can be picked interactively (lookalike names are pre-checked as a hint); `-y` skips the picker and only warns about lookalikes. Use `# pam:sensitive` to upgrade an existing plain key; sensitive cannot be downgraded. Remote values are not written into the local file until the push succeeds. After success, sensitive values in the local file are switched back to the placeholder (or empty when none exists).
- Inline `KEY=value` overlays the local file before a full replace; `--unset <keys>` removes keys from the final set (applied after overrides).
- Placeholders from another environment (e.g. a copied file) are rejected, so a placeholder is never stored as a secret.

| Final local value | Already-sensitive key | Normal key |
| --- | --- | --- |
| This env's placeholder | keep | (should not appear) |
| Empty string | keep | key kept, value cleared |
| New plaintext | rotate | update |
| Missing line / `--unset` | delete | delete |

- Changes are merged key by key against the last pull/push baseline: a key changed on one side only takes that side; only keys changed on both sides conflict.
- On conflict, `pull` defaults to remote values and `push` defaults to local values. The conflicting keys are listed and you confirm (or pick the other side, or abort); you are then told to edit the local file manually and `push`.
- `pull` keeps unpushed local edits of ordinary keys and tells you about them. Already-sensitive keys are always replaced with the placeholder. `push` merges keys changed only on the remote into your local file after a successful push, instead of overwriting your other edits.
- **Without a baseline** (never pulled/pushed here): one-sided keys are kept; only keys present on both sides with different values conflict. A first `push` therefore does not silently drop remote-only keys (use `--unset`, or sync then delete the line); a first `pull` does not silently drop local-only keys.
- After a baseline exists, a missing file key / `--unset` means delete (full desired state).
- `pull` keeps comments in your local file where possible. If only the remote changed, `push` asks you to `pull` first.
- The diff masks every value as `*****` by default; `--show-values` reveals non-sensitive values only. Names like `SECRET`, `TOKEN`, `PASSWORD`, `ACCESS_KEY`, `APIKEY`, `JWT`, `SESSION`, `COOKIE`, or `DATABASE_URL` stay masked.
- If the `-e` environment does not exist, `push` asks for its URL, validates everything, then creates the environment and uploads the variables together.

### `-y` and `-f`

| Option | Effect |
| --- | --- |
| `-y` | Skips ordinary confirmations: no-baseline prompt, final push, creating a missing environment, sensitive picker, `remove`. Lookalike new keys are only hinted, never auto-marked. Large deletions of remote keys still require one more confirm |
| `-f` | Skips conflict confirmation only and uses the default side (remote for pull, local for push) |

Neither implies the other; pass both to skip everything.

### Marking sensitive variables

Put `# pam:sensitive` above the key (other comments may sit in between). Comments above a key and inline comments are preserved.

```bash
# DB password
# pam:sensitive
API_TOKEN=xxxx # production only
NORMAL=1
```

Sensitive values are stored encrypted in PAM. Only `run` decrypts them (on the server) and injects them into the child process; the CLI never prints them. The web UI, `render`, `pull` and `fork` never get plaintext, owners included. Plaintext exists only in the child process environment; if the app prints, logs, or another local reader inspects that env, that is outside the CLI's control.

## `pamenv remove`

Deletes a remote environment. Requires project **admin** (including the project owner) and asks for confirmation twice. Local `.env.*` files are not deleted.

```bash
pamenv remove <slug|id> -e local
pamenv remove <slug|id> -e local -y
```

## Settings and language

```bash
pamenv config set domain pam.example.com   # save the default PAM origin
pamenv config set locale zh                 # pin the CLI language (en | zh)
pamenv config list
pamenv locales pull                         # refresh server error messages
```

| Key | Description |
| --- | --- |
| `domain` / `url` | Default PAM origin, so you don't need `--domain` every time |
| `locale` | `en` or `zh`; once set, browser sign-in no longer changes the CLI language |

Without `locale`, the CLI follows the language of the browser sign-in page.

When a request fails, the CLI prints a readable message plus the error code (e.g. `api:not_authorized`) and a `requestId`. Include both when reporting a problem.

## Sign-in and local credentials

- A CLI sign-in lasts **30 days** by default; run `pamenv login` again when it expires.
- `pamenv logout` revokes the credential on the server immediately and clears local sign-in and sync records.
- `config.json` (mode 0600) keeps only non-secret fields (baseUrl / locale / email). The bearer token goes into an OS-bound vault: DPAPI-protected `credentials.enc` on Windows, the login keychain on macOS, and a 0600 private file elsewhere. Tokens still sitting in an old config.json are migrated out on the next read. Different `.pam` roots do not share credentials.

## Project permissions

Access comes from your team role on the project; teams are managed in the PAM web UI.

| Role | run | push | pull / render (no sensitive values) | remove environment |
| --- | --- | --- | --- | --- |
| owner / admin | ✓ | ✓ | ✓ | ✓ |
| member | ✓ (except protected environments) | ✓ (except protected environments) | — | — |

- Every `run`, `pull` and `render` read is logged (who, which environment, how many keys; never values). Admins / owners can view the log on the environment page in the web UI.
- Once a member is removed from the team, their CLI credential can no longer read the project's variables.

Only the project owner can transfer or delete a project, from the web UI's General tab. The CLI has no command for either.
