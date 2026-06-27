# Eckstein Studio

Schlankes internes Tool — **Plattform-Links**, **Thumbnail Generator** und **Infobox Generator**. Alles andere läuft über Notion.

## Schnellstart

```bash
pnpm install
pnpm dev
```

Login entfällt — direkt `/links`, `/thumbnail` oder `/infobox` öffnen.

## Seiten

| Route | Funktion |
|-------|----------|
| `/links` | Plattform-Quick-Links (editierbar in `lib/links.ts`) |
| `/thumbnail` | YouTube-Thumbnail-Template · 1280×720 PNG Export |
| `/infobox` | CapCut-Infobox-Overlays · PNG mit transparentem Hintergrund |

## Env

Keine Pflicht-Variablen.

Deploy: Vercel (GitHub → `main`).
