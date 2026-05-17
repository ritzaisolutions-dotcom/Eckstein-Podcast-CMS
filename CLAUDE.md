# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Eckstein Podcast CMS — internal content management system for the Eckstein Podcast (Kevin Ritz + Florian Spieß). Manages all content types across YouTube, Rumble, Spotify, TikTok, Instagram, X, Substack, and more.

## Stack

- **Framework:** Next.js 16 App Router via `@opennextjs/cloudflare` (OpenNext adapter)
- **Runtime:** Cloudflare Workers (V8 Isolates) — no Node.js runtime, use Web APIs
- **DB:** Cloudflare D1 (SQLite) via Drizzle ORM (`drizzle-orm/d1`, `sqliteTable`)
- **Storage:** Cloudflare R2 for all media uploads
- **Cache/Session:** Cloudflare KV
- **Queues:** Cloudflare Queues for async jobs (analytics refresh)
- **Crypto:** Web Crypto API only — no Node `crypto` module
- **Styling:** Tailwind CSS with custom design tokens
- **Deploy target:** Cloudflare Workers & Pages (GitHub auto-deploy)

## Commands

```bash
pnpm dev                          # Next.js dev server (local, fast iteration)
pnpm preview                      # Miniflare/Wrangler local preview (Workers runtime)
pnpm build                        # Next.js build
pnpm opennextjs-cloudflare build  # Build for Cloudflare deployment

pnpm drizzle-kit generate         # Generate D1 SQL migrations from schema
pnpm drizzle-kit studio           # Browse D1 data locally

wrangler d1 execute eckstein-cms-db --file=migrations/0000_init.sql  # Apply migration
wrangler d1 execute eckstein-cms-db --command "SELECT * FROM content_pieces"
wrangler secret put ADMIN_PASSWORD   # Set production secrets
wrangler deploy                      # Manual deploy
```

Local secrets go in `.dev.vars` (gitignored). See `.dev.vars.example` for all required keys.

## Architecture

### Route Groups

- `app/(auth)/login` — login page, the only unauthenticated route
- `app/(cms)/` — all CMS routes, gated by `middleware.ts`
- `app/api/cron/refresh-analytics` — called by Cloudflare Cron Trigger every 6h
- `app/api/upload` — R2 multipart upload + signed URLs
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
- `vault_entries` — AES-256-GCM encrypted sensitive data
- `clip_queue` — timestamps from episodes queued as future shorts
- `guests` — guest database, linked via `content_pieces.guest_id`

### Workers Compatibility Rules

- **No `Buffer`** — use `Uint8Array`, `TextEncoder`, `TextDecoder`
- **No `fs`** — no runtime file reads; bundle everything at build time
- **No Node `crypto`** — use `crypto.subtle` (Web Crypto API) for all hashing/encryption
- **No bcrypt** — use PBKDF2 via `crypto.subtle.deriveKey` for password key derivation
- **D1 client** — accessed via `getRequestContext().env.DB`, not a direct connection string

### Auth Flow

`middleware.ts` checks for cookie `eckstein_session` on all `/(cms)` routes. Login POST compares against `ADMIN_PASSWORD` env var and sets an HMAC-signed HTTP-only cookie (signed with `SESSION_SECRET` via Web Crypto HMAC-SHA256, 30-day TTL).

### Vault Encryption

All sensitive vault fields use AES-256-GCM via `lib/crypto.ts`. Key derived per-entry from `VAULT_MASTER_KEY` + per-row salt (PBKDF2). DB stores ciphertext + salt + IV as `blob`. Decryption only on-demand per field, never bulk. Every reveal writes to `vault_audit_log`.

### Analytics Pull

Cron runs `app/api/cron/refresh-analytics` every 6h. For each `content_platform_links` row with `external_id` and platform in `('youtube', 'yt_shorts', 'ig_reels', 'instagram')`, fetches stats and inserts a new `analytics_snapshots` row. Other platforms (Rumble, Spotify, TikTok, X, Substack) are entered manually via the edit form.

### Cloudflare Bindings (`wrangler.toml`)

| Binding | Type | Purpose |
|---|---|---|
| `DB` | D1 | Main database |
| `MEDIA` | R2 | All file uploads |
| `CACHE` | KV | Sessions, analytics cache, share-link tokens |
| `ANALYTICS_QUEUE` | Queue | Async analytics refresh jobs |

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
| `wrangler.toml` | All Cloudflare bindings, cron schedule, worker config |
| `open-next.config.ts` | OpenNext adapter config |
| `lib/db/schema.ts` | Single source of truth for all Drizzle table definitions |
| `lib/crypto.ts` | AES-256-GCM encrypt/decrypt (Web Crypto only) |
| `lib/auth.ts` | Cookie sign/verify (HMAC-SHA256 via Web Crypto) |
| `lib/r2.ts` | R2 upload helpers |
| `middleware.ts` | Auth gate for all /(cms) routes |
| `app/(cms)/layout.tsx` | Sidebar + top header shell |
| `app/(cms)/page.tsx` | OHE dashboard (default landing after login) |

## GitHub

Remote: `https://github.com/ritzaisolutions-dotcom/Eckstein-Podcast-CMS.git`
Deploy: GitHub → Cloudflare Workers & Pages auto-deploy on `main`
Domain target: `cms.eckstein-podcast.de`
