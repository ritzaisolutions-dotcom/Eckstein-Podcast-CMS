# Eckstein Studio

Schlankes internes Tool — **Plattform-Links** und **Thumbnail Generator**. Alles andere läuft über Notion.

## Schnellstart

```bash
pnpm install
pnpm dev
```

Login: `ADMIN_PASSWORD` und `SESSION_SECRET` in `.env.local`.

## Seiten

| Route | Funktion |
|-------|----------|
| `/links` | Plattform-Quick-Links (editierbar in `lib/links.ts`) |
| `/thumbnail` | YouTube-Thumbnail-Template · 1280×720 PNG Export |

## Env

```
ADMIN_PASSWORD=...
SESSION_SECRET=...
```

Deploy: Vercel (GitHub → `main`).
