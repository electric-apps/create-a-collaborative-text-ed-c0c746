# CollabEdit

A real-time collaborative rich-text editor where multiple users can edit the same document simultaneously, with live cursors, user presence indicators, and a document library for managing multiple documents.

Generated with [one-shot-electric-app](https://github.com/anthropics/one-shot-electric-app) — an Electric SQL + TanStack DB + shadcn/ui scaffold.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for local Postgres + Electric)

## Setup

```bash
pnpm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Purpose | How to get it |
|---|---|---|
| `DATABASE_URL` | Postgres connection | Auto-provisioned by `docker compose up` (local) or from your Electric Cloud claim |
| `ELECTRIC_URL` | Electric shape sync endpoint | `http://localhost:3000` (local) or `https://api.electric-sql.cloud` |
| `ELECTRIC_SOURCE_ID` | Electric Cloud source (cloud mode only) | From the Cloud claim URL or `npx @electric-sql/cli` |
| `ELECTRIC_SECRET` | Electric Cloud auth (cloud mode only) | Same source as above |
| `ELECTRIC_YJS_SERVICE_ID` | Yjs Durable Streams service ID | `npx @electric-sql/cli services create yjs` |
| `ELECTRIC_YJS_SECRET` | Yjs service auth token | Same source as above |

### Getting Yjs service credentials

This app uses `@durable-streams/y-durable-streams` for collaborative editing. You need to provision a Yjs service:

```bash
# Log in (opens a browser)
npx @electric-sql/cli auth

# Create a Yjs service
npx @electric-sql/cli services create yjs --environment <env-id> --name my-yjs-service
```

Add the resulting service ID and secret to your `.env` as `ELECTRIC_YJS_SERVICE_ID` and `ELECTRIC_YJS_SECRET`.

## Running

```bash
# Start local infra (Postgres + Electric)
docker compose up -d

# Run migrations
pnpm drizzle-kit migrate

# Start the dev server
pnpm dev
```

App runs at `http://localhost:5174`.

> **Inside the agent sandbox**, `pnpm dev:start` launches Vite behind a Caddy reverse proxy with HTTP/2 multiplexing (avoids the browser's ~6-connection-per-origin SSE cap). Outside the sandbox, `pnpm dev` runs Vite directly.
>
> **HTTPS setup (one-time):** from the Electric Studio repo root run `pnpm trust-cert` and restart your browser.

## Architecture

- **Sync**: Electric SQL shapes → TanStack DB collections → `useLiveQuery` for live document list
- **Collaborative editing**: Yjs CRDTs synced via `@durable-streams/y-durable-streams` through a server-side proxy
- **Presence**: Yjs Awareness for live cursors and user indicators
- **Rich text**: TipTap editor with Collaboration and CollaborationCaret extensions
- **Mutations**: Optimistic via `collection.insert/update/delete`, reconciled through API routes
- **UI**: shadcn/ui + Tailwind CSS + lucide-react
- **Validation**: zod/v4

See [`PLAN.md`](./PLAN.md) for the full implementation plan.

## Tests

```bash
pnpm test          # unit + integration tests
pnpm build         # type check + production build
```

## Deploying

The scaffold is dev-oriented. For production deployment patterns, see the [Electric SQL docs](https://electric-sql.com/docs).
