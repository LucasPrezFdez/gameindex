**English** · [Español](README.es.md)

# GameIndex

A video game database, social network and review aggregator, with an AI assistant that searches the catalog. Final project of my Higher Technician degree in Cross-Platform Application Development (DAM).

![GameIndex home page with its main sections and figures](https://lucasprezfdez.github.io/assets/img/proyecto-gameindex.webp)

29 pages and 39 API endpoints on top of a 34-table PostgreSQL schema: game pages, reviews, ratings, user lists, profiles, rankings, release notifications and an admin panel.

## Highlights

- **AI assistant with tool calling.** A chat ([`app/api/chat/route.ts`](app/api/chat/route.ts)) backed by Llama 3.3 70B on Groq that answers with real catalog data through three tools: `search_games`, `get_game_details` and `get_similar_games`.
  - Up to three tool rounds per answer, streamed to the UI.
  - If the model calls a tool with invalid arguments, it is told to answer in plain text instead of failing.
  - Guardrails: at most 20 messages of 4,000 characters, and 40 requests per minute.
  - Every LLM call is logged with tokens, latency and outcome (model, cache hit, fallback or error), and the admin panel shows the metrics ([`services/llm-metrics.ts`](services/llm-metrics.ts)).
- **Custom authentication.** HS256 tokens signed with HMAC, passwords hashed with scrypt and a per-user salt, and constant-time comparisons ([`services/auth.ts`](services/auth.ts)). Admins come from the `ADMIN_EMAILS` variable and are synced on every sign-in. Banned users can't sign in, and admin actions go to an audit log.
- **Fair rankings.** Top lists use a Bayesian weighted rating: games with only a handful of votes are pulled towards the mean, so they can't top the charts ([`lib/ranking.ts`](lib/ranking.ts)).
- **Search and catalog.** Full-text search with Meilisearch. The catalog comes from RAWG on the server, with local fallback data when there is no API key, and an IGDB integration.
- **Safe user content.** Reviews are written in a rich text editor (TipTap) and sanitized on the server with an allow-list of tags ([`lib/sanitize-review.ts`](lib/sanitize-review.ts)).
- **Idempotent seeding.** The mock-content script derives UUIDs from slugs with SHA-256, so running it again updates rows instead of duplicating them.

## Stack

- Next.js (App Router), TypeScript
- Tailwind CSS, shadcn/ui-style components, TipTap
- PostgreSQL on Neon
- Meilisearch
- Groq (Llama 3.3 70B)
- RAWG and IGDB APIs

## Getting started

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Secret used to sign the auth tokens |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site (no trailing slash), for metadata, sitemap, robots and OG |
| `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY` | Full-text search |
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`, `RAWG_API_KEY` | Catalog integrations |
| `LOG_LEVEL` | Minimum log level (`debug`, `info`, `warn`, `error`) |
| `GROQ_API_KEY`, `GROQ_MODEL` | AI chat |
| `CRON_SECRET` | Authorizes `/api/cron/check-releases` (release notifications) |
| `ADMIN_EMAILS` | Comma-separated emails of the `/admin` panel admins |

## Game catalog

The `/games` route uses RAWG on the server to list games with pagination. Add your key to `.env`:

```bash
RAWG_API_KEY=your_rawg_key
```

If the key isn't set, the app falls back to local data.

## Main routes

- `/`
- `/games`
- `/games/[slug]`
- `/games/[slug]/reviews`
- `/rankings`
- `/rankings/top-50`
- `/platforms/[slug]`
- `/genres/[slug]`
- `/companies/[slug]`
- `/users/[username]`
- `/lists/[slug]`

## Database

The initial schema is in `database/schema.sql`. The app uses `DATABASE_URL` to read from and write to Neon on the server. The `app_users` table stores the users of the custom authentication and `profiles` stores the public profiles.

## Admin accounts

The `/admin` panel is reserved for the emails listed in `ADMIN_EMAILS`:

```bash
ADMIN_EMAILS=foo@example.com,bar@example.com
```

- The list is comma-separated, surrounding spaces are ignored and emails are lowercased.
- The `is_admin` flag is synced on every sign-in/sign-up. If you remove an email from the variable, that user stops being an admin on their next login.
- **There is no UI** to promote or demote admins: the flag is controlled only by this variable.
- The panel isn't linked publicly: the "Admin" button in the header only shows when the active session is an admin. Any non-admin who types `/admin` is redirected to `/`.
- Changing `ADMIN_EMAILS` in production requires a redeploy for the new value to take effect.

Users with `banned_at` set can't sign in (sign-in returns 403). Bans are managed from the panel.

### Seeding mock users and content in Neon

The 50 profiles in [data/fallback-users.ts](data/fallback-users.ts) are content for the public UI (`/users`, `/lists/...`), not real accounts. To also show them in `/admin/users` with all their content (lists, reviews, ratings):

```bash
npx tsx scripts/seed-fallback-content.ts
```

The script seeds idempotently:

- 50 accounts in `app_users` plus a row in `profiles` (emails `@mock.gameindex.local`, random passwords, so they can't sign in).
- The referenced games that aren't in `games` yet (taken from [data/fallback-games.ts](data/fallback-games.ts)).
- ~110 lists with their `list_items`.
- ~100 reviews and their associated `ratings`.

It uses UUIDs derived (SHA-256) from the mock slugs and IDs, so running it again updates the content without duplicating rows.

There is also a **Sembrar mocks** (seed mocks) button in `/admin/users` that calls `POST /api/admin/seed/fallback-users` with the same logic.

## Author

Lucas Pérez Fernández · [Portfolio](https://lucasprezfdez.github.io/) · [GitHub](https://github.com/LucasPrezFdez)
