# Gravurstastich

Monorepo for the Gravurstastich (Review Snapp) apps. Managed with **pnpm workspaces** and a single lockfile.

## Packages

| Package | Path | Description |
|---------|------|-------------|
| `@gravurstastich/core` | `review_snapp_core` | Backend API |
| `@gravurstastich/panel` | `review_snapp_panel` | Admin panel |
| `@gravurstastich/web` | `review_snapp_web` | Public web app |

## Requirements

- Node.js `>=22.12.0` (see `.nvmrc`)
- **pnpm `12.4.2`** only (pinned via `packageManager` + Corepack)

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
```

Do not use npm, yarn, or bun in this repo. Installs are blocked unless the client is pnpm.

## Setup

```bash
# from repo root
pnpm install
```

Copy local `.env` files into each package (they are gitignored).

## Scripts

```bash
pnpm dev:core    # API (Node --watch on ./src)
pnpm dev:panel   # admin panel
pnpm dev:web     # public web
pnpm build:panel
pnpm build:web
pnpm lint
```

Or filter any package:

```bash
pnpm --filter @gravurstastich/core <script>
pnpm --filter @gravurstastich/panel <script>
pnpm --filter @gravurstastich/web <script>
```

Default branch: `dev`.
