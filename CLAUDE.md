# Eckstein Studio

Minimal internal tool: **platform links** + **thumbnail generator**. Content management moved to Notion.

## Stack

- **Framework:** Next.js 16 App Router
- **Runtime:** Vercel
- **Auth:** none (internal tool, open access)
- **Styling:** Tailwind + Dark Liquid Glass design tokens

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
```

Secrets in `.env.local` (gitignored).

## Routes

- `app/(cms)/links` — platform quick-links (`lib/links.ts`)
- `app/(cms)/thumbnail` — YouTube thumbnail generator (client-side PNG export)
- `proxy.ts` — no-op pass-through (legacy matcher)

## Env

No required environment variables.

## Key Files

| File | Purpose |
|---|---|
| `lib/links.ts` | Platform link groups (edit until Notion migration done) |
| `components/ThumbnailGenerator.tsx` | 1280×720 template + export |
| `components/Sidebar.tsx` | Nav: Links, Thumbnail |
| `proxy.ts` | Request pass-through (no auth) |

Deploy: Vercel auto-deploy on `main`.
