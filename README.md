# Eckstein Studio

Schlankes internes Tool — **Plattform-Links** und **Thumbnail Generator**. Alles andere läuft über Notion.

## Schnellstart

```bash
pnpm install
pnpm dev
```

Login entfällt — direkt `/links` oder `/thumbnail` öffnen.

## Seiten

| Route | Funktion |
|-------|----------|
| `/links` | Plattform-Quick-Links (editierbar in `lib/links.ts`) |
| `/thumbnail` | YouTube-Thumbnail-Template · 1280×720 PNG Export |

## Env

Keine Pflicht-Variablen.

Deploy: Vercel (GitHub → `main`).
