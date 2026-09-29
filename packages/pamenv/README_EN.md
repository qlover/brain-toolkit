# pamenv-cli

`pamenv` syncs PAM multi-environment variables with local `.env.<environment>` files: `init` creates a project from the current directory, then `pull` / `push` keep local files and PAM in sync.

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
pamenv pull <slug> -e staging     # download into .env.staging
```

## Commands

| Command | Description |
| --- | --- |
| `pamenv login` | Sign in through the browser |
| `pamenv logout` | Sign out and revoke the current CLI credential |
| `pamenv projects` | List projects you can access |
| `pamenv init` | Create a project interactively |
| `pamenv fork <slug\|id>` | Fork a readable project into your own private project |
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
| `--local` | Keep sign-in and sync state in `.pam/` under the current directory, isolated from the global sign-in; add `.pam/` to `.gitignore` |

Do not pass `--url` and `--domain` together.

```bash
pamenv --domain pam.localhost:3400 login
pamenv --local --domain pam.localhost:3400 login
pamenv --local projects
```

## Environments and local files

- `-e <env>` selects the environment: `-e local` maps to `.env.local`, `-e staging` to `.env.staging`.
- Without `-e`, the project's first environment is used (`remove` always requires `-e`).
- `--file <path>` uses another file, relative to the current directory (or `-o`), or an absolute path.

```bash
pamenv pull <slug> -e local --file .env   # write .env instead of .env.local
pamenv push <slug> -e local --file .env   # read .env and push to local
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

## `pamenv pull` / `pamenv push`

```bash
pamenv pull <slug|id> -e staging
pamenv pull <slug|id> -e staging -f            # overwrite local changes without asking
pamenv push <slug|id> -e staging
pamenv push <slug|id> -e staging -y            # skip ordinary confirmations
pamenv push <slug|id> -e staging -f            # on conflict, overwrite remote with local
pamenv push <slug|id> -e staging --show-values # show non-sensitive values in the preview
```

- `pull` keeps comments in your local file where possible and asks before overwriting local content that differs.
- `push` shows a diff first. If the remote changed (for example in the web UI) and you have not pulled, it asks you to `pull` first; if both sides changed, it lets you resolve the conflict.
- The diff masks every value as `*****` by default; `--show-values` reveals non-sensitive values only (names like `*_SECRET` or `*_TOKEN` are treated as sensitive).
- If the `-e` environment does not exist, `push` asks for its URL, validates everything, then creates the environment and uploads the variables together.

### `-y` and `-f`

| Option | Effect |
| --- | --- |
| `-y` | Skips ordinary confirmations: first push, final push, sensitivity of new keys, creating a missing environment, `remove` prompts |
| `-f` | Skips conflict overwrite confirmation only |

Neither implies the other; pass both to skip everything.

### Marking sensitive variables

Put `# pam:sensitive` above the key (other comments may sit in between). Comments above a key and inline comments are preserved.

```bash
# DB password
# pam:sensitive
API_TOKEN=xxxx # production only
NORMAL=1
```

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

## Sign-in lifetime

- A CLI sign-in lasts **30 days** by default; run `pamenv login` again when it expires.
- `pamenv logout` revokes the credential on the server immediately and clears local sign-in and sync records.

## Project permissions

Access comes from your team role on the project; teams are managed in the PAM web UI.

| Role | pull / push | remove environment |
| --- | --- | --- |
| owner / admin | ✓ | ✓ |
| member | ✓ | — |

Only the project owner can transfer or delete a project, from the web UI's General tab. The CLI has no command for either.
