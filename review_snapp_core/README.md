# review_snapp_core

TypeScript API (`tsx`). Import modules **directly** — there are no barrel `index` re-exports under `controllers/`, `services/`, `models/`, or `validations/`.

```bash
pnpm dev          # tsx watch
pnpm start        # tsx src/index.ts
pnpm typecheck    # tsc --noEmit
```

Routes are registered from `src/routes/v1.routes.ts` (not `routes/v1/index`).

## Pre-Deployment (GitHub Actions)

The old URL-based deployment (`.github/workflows/deploy.yml` → `DEPLOY_URL` webhook running the giant VPS script) has been replaced by `.github/workflows/pre-deploy.yml`.

| | |
|---|---|
| **Trigger** | Push (merge) to `dev` |
| **On the GitHub runner** | `pnpm install` / `npm ci` — verifies the lockfile. App runs TypeScript from source via `tsx` (`src/index.ts`) |
| **On the server (SSH)** | 1. `git fetch origin dev` + `git switch dev` + `git reset --hard origin/dev`<br>2. `npm install --legacy-peer-deps` — **only if** the update changed `package.json`, `package-lock.json` or `yarn.lock`, or `node_modules` is missing, or the previous commit is unknown (fresh/shallow clone)<br>3. `pm2 describe` → `pm2 restart <app>` → `pm2 save` (fails the deploy with a clear error if the pm2 process doesn't exist) |

The server never runs a build (there is nothing to build), and `npm install` is skipped when dependencies didn't change, so the server stays out of the hot path.

### Required GitHub Secrets (repo → Settings → Secrets and variables → Actions)

| Secret | Value | Example |
|---|---|---|
| `SERVER_HOST` | Server IP or hostname | `1.2.3.4` |
| `SSH_USER` | SSH login user | `deploy` |
| `SSH_KEY` | Private key (full contents, incl. BEGIN/END lines). Pair must be in the server's `~/.ssh/authorized_keys` | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `REMOTE_PATH` | Absolute path to the cloned repo on the server | `/var/www/html/review_snapp/review_snapp_core` |
| `PM2_APP_NAME` | Name of the pm2 process to restart | `review_snapp_api` |

SSH runs on the default port 22. If your server uses another port, add `-p <port>` back into the `ssh` command in `pre-deploy.yml`.

No GitHub **variables** are used by this workflow.

### Server prerequisites (one-time)

1. Clone the repo and check out `dev`: `git clone -b dev <repo-url> /var/www/html/review_snapp/review_snapp_core`
2. Install dependencies once: `cd /var/www/html/review_snapp/review_snapp_core && npm install --legacy-peer-deps` (afterwards the workflow does this automatically only when package files change — but it also installs if `node_modules` is missing)
3. Create `.env` with real values — gitignored, untouched by deploys
4. Start the app and save the pm2 name: `pm2 start ecosystem.config.json && pm2 save` (process name must match the `PM2_APP_NAME` secret, e.g. `review_snapp_api`)
5. Generate an SSH key pair for deployment; put the **public** key in `~/.ssh/authorized_keys` on the server and store the **private** key as the `SSH_KEY` secret
6. Remove the old webhook/deploy script from the server if it is no longer needed (it was triggered by `DEPLOY_URL`)

After that, merging into `dev` fully deploys the API automatically.
