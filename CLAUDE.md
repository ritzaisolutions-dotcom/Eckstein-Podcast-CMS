# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Eckstein Podcast CMS — internal content management system for the Eckstein Podcast (Kevin Ritz + Florian Spieß). Manages all content types across YouTube, Rumble, Spotify, TikTok, Instagram, X, Substack, and more.

## Stack

- **Framework:** Next.js 16 App Router
- **Runtime:** Node.js on Vercel (Fluid Compute)
- **DB:** Neon Postgres via Drizzle ORM (`drizzle-orm/neon-http`, `pgTable`)
- **Storage:** Vercel Blob for all media uploads
- **Crypto:** Web Crypto API (`crypto.subtle`) — works in both Node.js and edge
- **Styling:** Tailwind CSS with custom design tokens
- **Deploy:** Vercel (GitHub auto-deploy on `main`)

## Commands

```bash
pnpm dev              # Next.js dev server
pnpm build            # Next.js build
pnpm lint             # ESLint

pnpm db:generate      # Generate Postgres migrations from schema (drizzle-kit)
pnpm db:push          # Push schema changes directly to DB (dev only)
pnpm db:studio        # Browse DB locally via Drizzle Studio
```

Local secrets go in `.env.local` (gitignored). See `.env.example` for all required keys.

## Architecture

### Route Groups

- `app/(auth)/login` — login page, the only unauthenticated route
- `app/(cms)/` — all CMS routes, gated by `middleware.ts`
- `app/api/cron/refresh-analytics` — called by Vercel Cron every 6h (configured in `vercel.json`)
- `app/api/upload` — Vercel Blob upload
- `app/api/telegram/inbound` — Telegram webhook receiver
- `app/api/vault/reveal` — decrypt and return a single vault entry field
- `app/share/prep/[token]` — public read-only prep share (no auth)

### Data Model

**Central table: `content_pieces`** — all content types share one table with a `type` discriminator (`lfc`, `sfc`, `article`, `newsletter`, `social_post`, `media`). Don't create separate tables per content type.

Key relations:
- `content_platform_links` — N:M between content and platforms, holds per-platform URLs, captions, `scheduled_at`, `posted_at`, `external_id` (for analytics API calls)
- `analytics_snapshots` — append-only, never update; one row per pull per link for trend history
- `episode_preps` + `prep_sections` — episode prep workspace, linked to `content_pieces` after recording
- `forum_threads` + `forum_replies` — mind-dump / brainstorm area
- `vault_entries` — AES-256-GCM encrypted sensitive data (stored as base64 text)
- `clip_queue` — timestamps from episodes queued as future shorts
- `guests` — guest database, linked via `content_pieces.guest_id`

### DB Client

`lib/db/index.ts` exports `getDb()` — creates a Neon HTTP Drizzle client from `process.env.DATABASE_URL`. Call it directly in Server Components and API routes; no bindings needed.

### Auth Flow

`middleware.ts` checks for cookie `eckstein_session` on all `/(cms)` routes. Login POST compares against `ADMIN_PASSWORD` env var and sets an HMAC-signed HTTP-only cookie (signed with `SESSION_SECRET` via Web Crypto HMAC-SHA256, 30-day TTL).

### Vault Encryption

All sensitive vault fields use AES-256-GCM via `lib/crypto.ts`. `encryptPacked` produces a self-contained `Uint8Array` (16-byte salt + 12-byte IV + ciphertext), stored as base64 text. `decryptPacked` reverses it. Key derived from `VAULT_MASTER_KEY` via PBKDF2. Every reveal writes to `vault_audit_log`.

### Analytics Pull

Vercel Cron calls `app/api/cron/refresh-analytics` every 6h (schedule in `vercel.json`). For each `content_platform_links` row with `external_id` and platform in `('youtube', 'yt_shorts', 'ig_reels', 'instagram')`, fetches stats and inserts a new `analytics_snapshots` row.

## Design System (strict — no deviations)

```css
--navy:       #05101f
--navy-2:     #081525
--navy-3:     #0c1e35
--gold:       #c9a84c
--gold-light: #e2c06a
--gold-pale:  #f0dca0
--cream:      #f5eed8
--cream-dim:  rgba(245,238,216,0.55)
```

**UI is cream-first (light background):** `--cream` is the app background. Navy and Gold are accents, not backgrounds (exception: login screen is full Navy).

Fonts (via `next/font/google`): **Cinzel** (headlines, buttons), **Cormorant Garamond** (subheadlines), **EB Garamond** (body, inputs, tables). No sans-serif fonts anywhere.

All primary buttons: `font-cinzel uppercase tracking-wider`. All buttons follow gold/navy/cream pattern — no generic grays.

## Key Files

| File | Purpose |
|---|---|
| `vercel.json` | Cron schedule |
| `lib/db/schema.ts` | Single source of truth for all Drizzle table definitions |
| `lib/db/index.ts` | Neon Drizzle client (`getDb()`) |
| `lib/crypto.ts` | AES-256-GCM encrypt/decrypt (`encryptPacked` / `decryptPacked`) |
| `middleware.ts` | Auth gate for all /(cms) routes |
| `app/(cms)/layout.tsx` | Sidebar + top header shell |
| `app/(cms)/page.tsx` | OHE dashboard (default landing after login) |

## GitHub

Remote: `https://github.com/ritzaisolutions-dotcom/Eckstein-Podcast-CMS.git`
Deploy: GitHub → Vercel auto-deploy on `main`
Domain target: `cms.eckstein-podcast.de`
