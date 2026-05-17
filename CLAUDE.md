# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Eckstein Podcast CMS — internal content management system for the Eckstein Podcast (Kevin Ritz + Florian Spieß). Manages all content types across YouTube, Rumble, Spotify, TikTok, Instagram, X, Substack, and more.

## Stack

- **Framework:** Next.js 16 App Router
- **Runtime:** Node.js on Vercel (Fluid Compute)
- **DB:** Supabase Postgres via Drizzle ORM (`postgres` npm package + `drizzle-orm/postgres-js`)
- **Storage:** Vercel Blob for all media uploads
- **Crypto:** Web Crypto API (`crypto.subtle`)
- **Styling:** Tailwind CSS with custom design tokens
- **Deploy:** Vercel (GitHub auto-deploy on `main`)

## Commands

```bash
pnpm dev              # Next.js dev server
pnpm build            # Next.js build (must pass before every push)
pnpm lint             # ESLint

pnpm db:generate      # Generate Postgres migrations from schema (drizzle-kit)
pnpm db:push          # Push schema changes directly to DB (dev only)
pnpm db:studio        # Browse DB locally via Drizzle Studio
```

Local secrets go in `.env.local` (gitignored).

## Critical: DB Connection

**Always use Transaction Pooler (port 6543), never Session Pooler (port 5432).**

Vercel Serverless spawns multiple instances simultaneously. Each holds its own connection pool. Session Pooler (5432) exhausts Supabase's connection limit immediately. Transaction Pooler (6543) multiplexes everything correctly.

`lib/db/index.ts` uses `postgres(url, { max: 1, prepare: false })` — `max:1` per serverless instance, `prepare:false` required for PgBouncer.

`DATABASE_URL` in Vercel ENV must use port **6543**:
```
postgresql://postgres.[ref]:[password]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

## Critical: Server Components + DB

All Server Components that query the DB **must** have:
```ts
export const dynamic = "force-dynamic";
```
at the top of the file. Without it, Next.js tries to pre-render the page at build time, the DB connection times out, and the build hangs. Never use `export const revalidate = N` on page files — use `unstable_cache` at the query level instead (see `lib/cache.ts`).

## Caching

`lib/cache.ts` provides query-level caching via `unstable_cache` (works alongside `force-dynamic`):
- `getCachedPlatforms()` — 1h TTL, tag `"platforms"`
- `getCachedContentCounts()` — 60s TTL, tag `"content-counts"`
- `getCachedAnalyticsSnapshots(ids)` — 5min TTL, keyed by sorted content IDs

Use these in Server Components instead of direct DB calls for data that rarely changes.

## Architecture

### Route Groups

- `app/(auth)/login` — only unauthenticated route
- `app/(cms)/` — all CMS routes, gated by `middleware.ts`
- `app/api/cron/refresh-analytics` — Vercel Cron every 6h (schedule in `vercel.json`)
- `app/api/upload` — Vercel Blob upload
- `app/api/telegram/inbound` — Telegram webhook receiver
- `app/api/vault/reveal` — decrypt and return a single vault entry field
- `app/share/prep/[token]` — public read-only prep share (no auth)

### Data Model

**Central table: `content_pieces`** — all content types share one table with a `type` discriminator. Active types: `lfc`, `sfc`, `article`, `social_post`. Don't create separate tables per content type.

`lifecycleStage` field tracks production status: `draft` → `scripting` → `filming` → `editing` → `revision` → `live`. The `filmingDate` column stores the scheduled filming date (separate from `uploadDate`).

Key relations:
- `content_platform_links` — N:M between content and platforms, holds per-platform URLs, `scheduled_at`, `posted_at`, `external_id` (for analytics API calls)
- `analytics_snapshots` — append-only, never update; one row per pull per link for trend history
- `episode_preps` + `prep_sections` — episode prep workspace, linked to `content_pieces` after recording
- `forum_threads` + `forum_replies` — mind-dump / brainstorm area
- `vault_entries` — AES-256-GCM encrypted sensitive data (stored as base64 text)
- `clip_queue` — timestamps from episodes queued as future shorts
- `guests` — podcast guest CRM, linked via `content_pieces.guest_id`

### Auth Flow

`middleware.ts` checks for cookie `eckstein_session` on all `/(cms)` routes. Login POST compares against `ADMIN_PASSWORD` env var and sets an HMAC-signed HTTP-only cookie (signed with `SESSION_SECRET` via Web Crypto HMAC-SHA256, 30-day TTL).

### Vault Encryption

All sensitive vault fields use AES-256-GCM via `lib/crypto.ts`. `encryptPacked` produces a self-contained `Uint8Array` (16-byte salt + 12-byte IV + ciphertext), stored as base64 text. Key derived from `VAULT_MASTER_KEY` via PBKDF2. Every reveal writes to `vault_audit_log`. Loss of `VAULT_MASTER_KEY` = unrecoverable data.

### Analytics Pull

Vercel Cron calls `app/api/cron/refresh-analytics` every 6h. For each `content_platform_links` row with `external_id` and platform in `('youtube', 'yt_shorts', 'ig_reels', 'instagram')`, fetches stats and inserts a new `analytics_snapshots` row (append-only).

## Design System (strict — no deviations)

```css
--navy:       #05101f
--navy-2:     #081525
--navy-3:     #0c1e35
--gold:       #c9a84c
--gold-light: #e2c06a
--gold-pale:  #f0dca0
--cream:      #f5eed8
--cream-mid:  #ede5c4
```

**UI is cream-first:** `--cream` is the app background. Navy and Gold are accents (exception: login screen is full Navy).

Fonts: **Cinzel** (headlines, buttons, labels), **Cormorant Garamond** (subheadlines), **EB Garamond** (body, inputs, tables). No sans-serif anywhere.

CSS utility classes: `.cms-card`, `.cms-table`, `.cms-input`, `.cms-label`, `.cms-card-title` — defined in `globals.css`, use these instead of raw Tailwind for consistency.

## Key Files

| File | Purpose |
|---|---|
| `lib/db/schema.ts` | Single source of truth for all Drizzle table definitions |
| `lib/db/index.ts` | Supabase/postgres-js Drizzle client (`getDb()`) — Transaction Pooler, max:1 |
| `lib/cache.ts` | `unstable_cache` wrappers for slow/stable queries |
| `lib/crypto.ts` | AES-256-GCM encrypt/decrypt (`encryptPacked` / `decryptPacked`) |
| `middleware.ts` | Auth gate for all /(cms) routes |
| `components/Sidebar.tsx` | Nav sidebar + mobile bottom nav |
| `components/EpisodeForm.tsx` | Content creation form (type, lifecycle, platforms) |
| `app/(cms)/page.tsx` | Dashboard (default landing after login) |
| `vercel.json` | Cron schedule |

## GitHub

Remote: `https://github.com/ritzaisolutions-dotcom/Eckstein-Podcast-CMS.git`
Deploy: GitHub → Vercel auto-deploy on `main`
