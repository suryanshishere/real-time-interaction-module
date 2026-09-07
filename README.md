# PollBuzz on Cloudflare

PollBuzz is a real-time polling app deployed as one Cloudflare Worker. The same deployment serves the React UI, Hono API, D1 database access, and Durable Object WebSocket rooms.

Authentication is Google-only. Password login, signup, OTP/email verification, password reset, SMTP, the old Express/Socket.IO server, and the separate Vercel/Render deployments have been removed.

## Architecture

- React + Vite static assets
- Hono API in the same Cloudflare Worker
- Cloudflare D1 for users, polls, options, and votes
- Durable Objects for live WebSocket fan-out and serialized voting
- Google Identity Services for login
- Signed, HTTP-only, one-hour session cookies

The deployable project lives in `frontend/`. Node.js 22.12 or newer is required.

## Local development

```bash
cd frontend
npm ci
copy .env.example .env.local
copy .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Fill both copied files before testing login. The local site is normally `http://localhost:5173`.

Run the checks with:

```bash
npm test
npm run build
```

## Required configuration

Use one Google OAuth 2.0 **Web application** client ID for both browser and Worker verification.

| Setting | Local location | Production location | Purpose |
| --- | --- | --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | `frontend/.env.local` | Cloudflare Workers Builds > Settings > Build variables | Public client ID embedded by Vite |
| `GOOGLE_CLIENT_ID` | `frontend/.dev.vars` | Worker > Settings > Variables and Secrets, preferably encrypted | Expected audience when verifying Google ID tokens |
| `SESSION_SECRET` | `frontend/.dev.vars` | Worker > Settings > Variables and Secrets, encrypted | Signs application session cookies |
| `MONGO_URI` | Temporary shell environment only | Never add to Cloudflare | Source connection used only by the one-time exporter |
| `MONGO_DB_NAME` | Optional temporary shell environment | Never add to Cloudflare | Mongo database override for the exporter |
| `LEGACY_GOOGLE_LINKS_FILE` | Optional temporary shell environment | Never add to Cloudflare | Explicit mappings for legacy non-Gmail identities |
| `CONFIRM_PRODUCTION_IMPORT` | Temporary shell environment | Never add to Cloudflare | Safety confirmation required for the D1 import |

Do not commit `.env.local`, `.dev.vars`, the Mongo URI, or the generated `.migration` directory.

Generate a session secret with either:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

```bash
openssl rand -base64 32
```

## Google Cloud setup

1. Open Google Cloud Console and create or select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth client with application type **Web application**.
4. Add `http://localhost:5173` under Authorized JavaScript origins.
5. After the first Cloudflare deploy, add `https://pollbuzz.<your-workers-subdomain>.workers.dev` as another Authorized JavaScript origin.
6. Put the resulting `...apps.googleusercontent.com` value in both Google client ID settings in the table above.

This app uses the Google credential callback, so an Authorized redirect URI is not required.

## Cloudflare setup and first deployment

From `frontend/`:

```bash
npx wrangler login
npx wrangler d1 create pollbuzz-db
```

Copy the returned D1 UUID into `database_id` in `frontend/wrangler.jsonc`, replacing `PUT_D1_DATABASE_ID_HERE`. Then run:

```bash
npm run db:migrate:remote
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put SESSION_SECRET
npm run deploy
```

`npm run deploy` builds the browser and Worker together and deploys the generated Vite Worker configuration, including all assets and bindings. The result is a single `workers.dev` site.

For automatic deploys from GitHub, connect the repository in Cloudflare Workers Builds and use:

- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Deploy command: `npx wrangler deploy --config dist/pollbuzz/wrangler.json`
- Build variable: `VITE_GOOGLE_CLIENT_ID`
- Node version: 22.12 or newer

Set `GOOGLE_CLIENT_ID` and `SESSION_SECRET` as runtime Worker secrets, not build variables.

## One-time MongoDB to D1 migration

The exporter preserves legacy user IDs, poll ownership, session codes, poll totals, and valid per-user vote history. It deliberately excludes password hashes, OTPs, reset tokens, and SMTP data.

Google account ownership rules during the migration are conservative:

- Matching `@gmail.com` accounts and Google Workspace accounts can be linked after Google verifies the address.
- A legacy account using another domain requires an explicit mapping. Copy `scripts/legacy-google-links.example.json`, fill in the Mongo user ID and its matching primary or secondary Google email, and set `LEGACY_GOOGLE_LINKS_FILE` to its path.

During the final cutover, temporarily stop writes to the old deployment, then run in PowerShell from `frontend/`:

```powershell
$env:MONGO_URI = "your-mongodb-connection-string"
$env:MONGO_DB_NAME = "your-database-name" # optional
$env:LEGACY_GOOGLE_LINKS_FILE = ".\scripts\legacy-google-links.json" # optional
npm run data:export
```

Inspect `.migration/manifest.json` and the generated SQL. Apply the D1 schema first, then import:

```powershell
npm run db:migrate:remote
$env:CONFIRM_PRODUCTION_IMPORT = "pollbuzz-db"
npm run data:apply
```

The confirmation variable prevents an accidental production import. Run the import once against an empty migrated D1 database; generated statements intentionally fail on duplicates instead of overwriting data.

## Cutover verification

Before retiring the old deployment, verify:

1. `https://pollbuzz.<your-workers-subdomain>.workers.dev/api/health` returns `{"status":"ok"}`.
2. Google login and logout work on the final `workers.dev` origin.
3. A migrated owner can see existing polls.
4. Existing session codes open and show their historical totals.
5. A signed-in user can create a poll and vote once.
6. A second browser receives live chart updates through the WebSocket.
7. Cloudflare D1 row counts match `.migration/manifest.json`.

Keep the old Mongo deployment read-only until these checks pass. Cloudflare's free plan has usage limits and is not an uptime guarantee, but this design removes the always-on Node server and fits Cloudflare's free serverless model much better than the previous split deployment.
