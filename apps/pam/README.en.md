# PAM (`apps/pam`)

> 中文: [README.md](./README.md)

PAM is a multi-environment config and environment-variable platform for dev teams: variables are managed per project and per environment, sensitive values are encrypted at rest, and the [`pamenv`](../../packages/pamenv/README_EN.md) CLI syncs them between local repos and PAM. PAM is also a standard OAuth 2.0 authorization server that other apps can use for single sign-on.

**TL;DR**: `pnpm install` → copy `.env.template` to `.env` and fill it in → run `makes/sql/000-pam-full-schema.sql` on Supabase → `pnpm dev` (`http://pam.localhost:3400`) → sign in as a platform admin and finish login, mail and SMS setup under **Admin → Site settings**.

---

## Features

| Module                      | Description                                                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Projects & environments** | local / staging / production environments per project; variables isolated per environment, sensitive values encrypted with `PAM_ENV_SECRET_KEY`; public / private projects, fork, transfer, dotenv export |
| **Teams & permissions**     | Team members (admin / member), project collaborators; platform roles → permission keys (`pam_role_permissions`) gate API access                                                                           |
| **pamenv CLI**              | Browser device-code login (`/pamenv/device`), `pull` / `push` sync; the in-app `/docs/cli` page renders the pamenv README                                                                                 |
| **Sign-in**                 | Email + password, sign-up, forgot / reset password, email OTP / magic link, phone OTP, GitHub / Google (Supabase Auth), Brain OAuth (authorization code + PKCE)                                           |
| **OAuth server**            | Built on `@qlover/oauth-wrapper`: developer console for clients, consent page, token exchange, userinfo, revocation, in-app Playground; integration guide at `/docs/oauth`                                |
| **Admin console**           | Users, roles, permissions, site settings, locale CMS, request logs, mail logs, OTP monitor, Memory KV (platform admins only)                                                                              |

---

## Tech Stack

| Category    | Technologies                                                                   |
| ----------- | ------------------------------------------------------------------------------ |
| Framework   | Next.js 16 (App Router + Pages Router), React 19                               |
| Data & auth | Supabase (Postgres, Auth, Storage)                                             |
| OAuth       | `@qlover/oauth-wrapper`, `server/providers/SupabaseOAuthProvider.ts`           |
| Shared kit  | `@brain-toolkit/next-app-kit` (site settings, CORS, request logs, KV cache, …) |
| UI          | Ant Design 5, Tailwind CSS 4                                                   |
| i18n        | next-intl + ts2locales (see [docs/i18n.en.md](./docs/i18n.en.md))              |
| DI          | Inversify (`server/serverIoc.ts`)                                              |
| Validation  | Zod                                                                            |
| Quality     | TypeScript, ESLint, Prettier, Vitest                                           |

Runtime: Node.js `^20.17.0` or `>=22.9.0` (see `engines` in `package.json`).

---

## Getting Started

### 1. Environment variables

Copy `.env.template` to `.env` (or `.env.local`); every entry is commented. The minimum:

| Variable                             | Description                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `SITE_URL`                           | Site origin, e.g. `http://pam.localhost:3400` locally                       |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase project URL and anon key                                           |
| `SUPABASE_SERVICE_ROLE_KEY`          | Server only; needed when tables use RLS                                     |
| `JWT_SECRET` / `SESSION_SECRET`      | Login JWT and HttpOnly session signing secrets                              |
| `ENCRYPTION_KEY`                     | Encrypts third-party refresh tokens in the database                         |
| `PAM_ENV_SECRET_KEY`                 | Encrypts sensitive environment values (keep separate from `ENCRYPTION_KEY`) |

Once you can reach a PAM instance, `pnpm env:pull` / `pnpm env:push` (`pamenv pull/push pam -e local`) sync your local config.

### 2. Database

| Case                         | Script                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| Fresh install                | `makes/sql/000-pam-full-schema.sql` (drops and recreates tables — **never run on a database with data**) |
| Upgrade an existing database | `makes/sql/001-pam-upgrade.sql` (re-runnable, no data loss)                                              |

Run them in the Supabase SQL Editor. All tables use the `pam_` prefix.

### 3. Run

```bash
pnpm dev            # http://pam.localhost:3400 (APP_ENV=localhost)
pnpm dev:localhost  # http://localhost:3400
pnpm build && pnpm start   # production build, port 3401
```

`next.config.ts` regenerates `shared/config/apiRoutes.ts`, locale JSON and theme CSS on startup.

### 4. Site settings

Apart from the base secrets above, runtime config lives in the database (`pam_site_settings`) and is edited by platform admins under **Admin → Site settings** (`/admin/settings`):

| Section        | Contents                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Sign-in & auth | Phone OTP (memory / aliyun), Google, Brain PKCE, Brain Supabase SSO toggles; CLI token lifetime         |
| Brain OAuth    | brain-oauth site URL, client_id / secret, redirect URI, scopes, consent-page locale for PAM as a client |
| Mail           | Channel (disabled / memory / resend), Resend API key, sender, password-reset / password-changed notices |
| Aliyun SMS     | AccessKey, sign name, template                                                                          |
| API & CORS     | CORS rules for OAuth machine endpoints (origin × path × methods)                                        |
| Other          | OpenAI-compatible API, preview image storage                                                            |

The `memory` channel sends nothing: SMS codes show up in the OTP monitor and emails in the mail logs, which is handy for local development.

---

## Brain OAuth Sign-in

PAM signs in against [brain-oauth](../brain-oauth) as an OAuth client using authorization code + PKCE:

1. Register a client in the brain-oauth developer console with `redirect_uri` = `{SITE_URL}/api/callback/brain-oauth`.
2. In PAM **Site settings → Brain OAuth**, fill in the site URL and client_id. **Confidential clients must set client_secret**; public clients can leave it empty.
3. Enable "Brain PKCE" under **Site settings → Sign-in & auth**; the login page then shows "Sign in with Brain (PKCE)".

Flow: `/api/user/login/brain` redirects to the Brain consent page → `/api/callback/brain-oauth` exchanges the code → brain-oauth userinfo returns `sub`, `email`, `name`, `phone_number` → PAM links or creates the account by Brain identity → the refresh token from this login is revoked (PAM only uses the access token once).

- New accounts get the Brain display name and phone number; existing accounts only have blank fields filled, and a phone number already owned by another account is skipped.
- Brain accounts without an email (e.g. phone-only) get a `@brain.oauth` placeholder email in `auth.users`, which is never written to the PAM profile.
- brain-oauth environments are transparent to PAM; PAM only relies on the `sub` from userinfo.

---

## PAM as an OAuth Server

See the in-app guide at `/{locale}/docs/oauth` for third-party integration, and use `/{locale}/oauth/playground` to run the full flow with a registered client.

| Endpoint                    | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| `/{locale}/oauth/authorize` | Consent page (requires login)                         |
| `POST /oauth/token`         | `authorization_code` / `refresh_token` grants         |
| `GET /oauth/userinfo`       | User info with `Authorization: Bearer <access_token>` |
| `POST /oauth/revoke`        | RFC 7009 token revocation                             |

Machine endpoints have no locale prefix and bypass the session middleware. Clients are managed (registered, secret rotated) at `/{locale}/developer/apps`.

---

## Project Layout

| Path                  | Description                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/[locale]/`   | App Router public / product pages: home, projects, teams, auth, docs, OAuth consent and Playground, pamenv device approval                                  |
| `src/pages/[locale]/` | Pages Router consoles behind login: `admin/*`, `developer/apps`, `account`                                                                                  |
| `src/app/api/`        | Product APIs (`/api/pam/*`, `/api/user/*`, `/api/admin/*`, `/api/pam/cli/*`, …)                                                                             |
| `src/app/oauth/`      | OAuth machine endpoints (token, userinfo, revoke)                                                                                                           |
| `src/proxy.ts`        | Middleware: locale, session and admin gates                                                                                                                 |
| `server/`             | Server side: `controllers`, `services`, `repositorys`, `providers`, `serverIoc.ts`, `ServerConfig.ts`                                                       |
| `shared/`             | Shared by client and server: routes (`config/route.ts`), site setting definitions (`config/pamSiteSettings.ts`), i18n identifiers and mappings, Zod schemas |
| `makes/sql/`          | Full and upgrade SQL scripts                                                                                                                                |
| `tools/`              | Generators for API routes, locales, theme CSS                                                                                                               |
| `docs/`               | i18n conventions, Supabase error notes, prototypes                                                                                                          |
| `__tests__/`          | Vitest unit tests                                                                                                                                           |

Page access is defined in `shared/config/route.ts`: `AUTH_ROUTES` are public, `LOGINED_PAGES` require login, and `/admin/*` additionally requires a platform admin.

---

## Scripts

```bash
pnpm lint:fix     # ESLint autofix
pnpm type-check   # TypeScript check
pnpm test         # Vitest
pnpm format       # Prettier
```

`lint:fix` and `type-check` must pass before committing.
