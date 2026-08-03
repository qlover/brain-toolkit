# pamenv (`@brain-toolkit/pamenv`)

Pull PAM environments into the working directory and push local edits back.

## Install

```bash
pnpm --filter @brain-toolkit/pamenv build
```

## Commands

```bash
pamenv login
pamenv projects
pamenv pull <slug|id> -e staging
pamenv pull <slug|id> -e staging -f
pamenv push <slug|id> -e staging
pamenv push <slug|id> -e staging -y
pamenv push <slug|id> -e staging -f
pamenv push <slug|id> -e staging --show-values
pamenv logout
```

`-f` only skips conflict overwrite prompts. `-y` skips ordinary confirms (not conflict overwrite). Diff review masks all values by default; `--show-values` shows non-sensitive plaintext.

Auth/sync/`.env.*` use mode `0600` on POSIX. `pamenv logout` revokes the server token then clears local auth and `~/.pam/sync`. CLI tokens last **30d** by default (`PAM_CLI_TOKEN_EXPIRES_IN`, e.g. `21d`) and are revocable via `jti`.
