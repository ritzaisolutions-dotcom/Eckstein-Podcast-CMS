# Farbschemen — Eckstein Studio

Dieses Dokument grenzt die drei Marken-Farbwelten im CMS ab. Jeder Generator exportiert **nur** die Farben seiner Marke. Die CMS-Oberfläche (Sidebar, Editor, Buttons) nutzt durchgehend **Eckstein Shell** — das ist bewusst getrennt von den Export-Canvas-Farben.

---

## Übersicht

| Marke | Kontext | Primäre Stimmung | Generator / Route |
|---|---|---|---|
| **Eckstein Podcast** | Podcast-Thumbnail, CapCut-Infoboxen | Navy + Gold auf Cream | `/thumbnail`, `/infobox` |
| **RAIS** | Social Posts (LinkedIn etc.) | Linen, Sage, Orange | `/rais-post` |
| **Kevin Ritz** (Personal Brand) | YouTube-Thumbnails kevin_ritz | Racing Green, Near-Black, Off-White | `/kr-thumbnail` |

**CMS Shell** (Navigation, Karten, Inputs): Eckstein Navy/Gold/Cream — gilt für alle Routen, beeinflusst **nicht** den PNG-Export.

---

## 1. Eckstein Podcast

Spiritualer Podcast. Klassisch, warm, dunkel — Navy als Basis, Gold als Akzent.

### Tokens (`app/globals.css`, Präfix `--navy`, `--gold`, `--cream`)

| Token | Hex | Verwendung |
|---|---|---|
| `--navy` | `#05101f` | Hintergrund Thumbnail, Headlines (Infobox cream theme) |
| `--navy-2` | `#081525` | Shell-Gradient |
| `--navy-3` | `#0c1e35` | Sekundärtext |
| `--gold` | `#c9a84c` | Keyword, Badge, Akzentlinien |
| `--gold-light` | `#e2c06a` | Hervorgehobenes Gold |
| `--cream` | `#f5eed8` | Headline-Text auf Navy, Infobox-Hintergrund |
| `--cream-light` | `#faf6e6` | Oberflächen im Editor |

### Typografie

- **Display:** Cinzel (Headlines, EP-Badge)
- **Subhead:** Cormorant Garamond (Subline, kursiv)
- **Body:** EB Garamond (Branding-Zeile)

### Generatoren

- [`components/ThumbnailGenerator.tsx`](../components/ThumbnailGenerator.tsx) — 1280×720, Foto + Gradient-Overlay
- [`components/InfoboxGenerator.tsx`](../components/InfoboxGenerator.tsx) + [`lib/infobox-export.ts`](../lib/infobox-export.ts) — Themes `navy` / `cream`

### Regeln

- Gold nur für **ein** Akzent-Element (Keyword, Badge, Linie)
- Keine RAIS-Orange- oder KR-Green-Töne im Export
- Infobox: entweder Navy- oder Cream-Theme, nicht mischen

---

## 2. RAIS (Ritz AI Solutions)

B2B-Marke für Makler/KI. Hell, editorial, erdig — Linen-Hintergrund, Sage + Orange als Markenanker.

### Tokens (`app/globals.css`, Präfix `--rais-`)

| Token | Hex | Verwendung |
|---|---|---|
| `--rais-linen` | `#FBF8F3` | Post-Hintergrund, Export-Background |
| `--rais-cloud` | `#F5F2EC` | Alternative helle Fläche |
| `--rais-orange` | `#EC6A37` | Kicker-Akzent („RAIS“ nach ·), Trennlinie, Logo (Pictogram) |
| `--rais-sage` | `#789464` | Dekoratives Anführungszeichen |
| `--rais-pistachio` | `#3C5A2A` | Tiefer Grün-Akzent (Reserve) |
| `--rais-charcoal` | `#2F2A24` | Haupttext (Zitat) |
| `--rais-stone` | `#7B746B` | Kicker-Basis, Footer |
| `--rais-border` | `#D9D1C7` | Rahmen, Trennlinien |

### Typografie

- **Kicker:** JetBrains Mono (uppercase, letter-spacing)
- **Haupttext:** Baskerville / Palatino (serif, zitat-artig)
- **Footer:** Inter

### Assets

- Logo: `public/brand/RAIS_pictogram.svg` (Orange `#EC6A37`)

### Generator

- [`components/RaisPostGenerator.tsx`](../components/RaisPostGenerator.tsx) — 1080×1080, Route `/rais-post`

### Regeln

- **On-Tag / Kicker:** Text vor `·` in Stone, Teil nach `·` in Orange; Linie darunter Orange
- Kein Navy/Gold (Eckstein) und kein Racing Green (KR) im Canvas
- Footer und Logo sind fest, nicht editierbar

---

## 3. Kevin Ritz (Personal Brand)

Persönlicher YouTube-Kanal. Modern, grounded, commercially serious — dunkle Grüntöne + kontrastreiches Sans für Mobile-Lesbarkeit.

### Tokens (`app/globals.css`, Präfix `--kr-`)

| Token | Hex | Verwendung |
|---|---|---|
| `--kr-racing-green` | `#1B4A3D` | Hintergrund „zahl“, „statement“ |
| `--kr-near-black` | `#0A0A0A` | Hintergrund „split“, „face-keyword“; Textblock |
| `--kr-dark-grey` | `#2E2E2E` | Alternativer Block (face-keyword) |
| `--kr-off-white` | `#F2F1ED` | Headlines, Keywords, Zahlen |
| `--kr-silver` | `#B8BCC0` | Trennlinien, Pfeile, Sekundärtext, Unterstreichungen |

### Typografie

- **Headline / Keyword / Zahl:** Archivo Black (uppercase, sans-serif) — Mobile-Lesbarkeit
- **Wordmark:** Cormorant Garamond Italic (klein, nur Branding)
- **Kontext:** Inter Regular

### Assets

- Wordmark: `public/brand/kevin-ritz-wordmark.png` (Platzhalter: Text `kevin_ritz`)

### Generator

- [`components/KevinRitzThumbnailGenerator.tsx`](../components/KevinRitzThumbnailGenerator.tsx) — 1280×720, 5 Layouts, Route `/kr-thumbnail`

### Regeln

- Max. 5 Wörter Headline; ein visueller Fokuspunkt pro Layout
- Safe Zone unten rechts (213×120 px) immer frei — YouTube Timestamp
- Serif nur in der Wordmark, **nie** in Headline/Keyword
- Face-keyword: ab 3 Wörtern zweizeilig — erste 2 Wörter Off-White, Rest Silver
- Kein Gold (Eckstein) und kein RAIS-Orange/Sage im Export

---

## 4. CMS Shell (Eckstein Studio UI)

Die Bedienoberfläche aller Generatoren teilt sich ein Design — unabhängig vom Export-Inhalt.

| Element | Tokens |
|---|---|
| Sidebar / Hintergrund | `--cms-bg-gradient`, `--glass-*` |
| Nav aktiv | `--gold-light`, `--cream` |
| Editor-Karten | `--bg-surface`, `--border` |
| Buttons (primär) | `--navy` + `--gold` |
| Labels | Cinzel / EB Garamond |

**Wichtig:** Shell-Farben dürfen in Generator-Canvas-Code **nicht** als Export-Farben durchgereicht werden. Export nutzt immer markenspezifische Konstanten oder `--rais-*` / `--kr-*`.

---

## 5. Schnell-Referenz: Was womit nicht mischen

| Nicht kombinieren | Grund |
|---|---|
| Eckstein Gold + RAIS Orange | Zwei verschiedene Marken-Akzente |
| RAIS Sage/Linen + KR Racing Green | Widersprüchliche Markenidentität |
| Eckstein Serif (Cinzel) in KR-Headlines | KR verlangt fette Sans für Mobile |
| KR Silver + Eckstein Gold | Unterschiedliche Kanäle |
| `--navy` als RAIS-Post-Hintergrund | RAIS ist hell (Linen), nicht dunkel |

---

## 6. Technische Zuordnung

```
app/globals.css
├── Eckstein (--navy, --gold, --cream)     → Shell + Thumbnail + Infobox
├── RAIS (--rais-*)                        → RaisPostGenerator
└── Kevin Ritz (--kr-*)                    → KevinRitzThumbnailGenerator

Komponenten-COLORS-Objekte (Inline-Hex mit Fallback):
├── RaisPostGenerator.tsx      → COLORS.* (spiegelt --rais-*)
└── KevinRitzThumbnailGenerator.tsx → C.* (spiegelt --kr-*)
```

Neue Tokens immer mit Marken-Präfix (`--rais-`, `--kr-`) ergänzen — **nie** bestehende Eckstein-Tokens (`--navy`, `--gold`, `--cream`) überschreiben.

---

## 7. Neue Generatoren anlegen

1. Marke festlegen: Eckstein / RAIS / Kevin Ritz
2. Nur Tokens dieser Marke im Export-Canvas verwenden
3. CSS-Variablen in `app/globals.css` unter dem richtigen Block ergänzen
4. Route-spezifische Fonts in `app/(cms)/<route>/layout.tsx` laden
5. Diese Datei um Eintrag in der Übersichtstabelle erweitern
