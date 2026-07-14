# Review: Cursor-Arbeit am KR Thumbnail Generator

**Datum:** 2026-07-14
**Bewerteter Plan:** `~/.cursor/plans/kr_thumbnail_generator_29000385.plan.md`
**Bewerteter Commit:** `b0ffd15` — *Add KR Thumbnail generator with five layout variants.*
**Betroffene Dateien:** `components/KevinRitzThumbnailGenerator.tsx`, `app/(cms)/kr-thumbnail/{layout,page}.tsx`, `app/globals.css`, `components/{Sidebar,CommandPalette}.tsx`

---

## Gesamturteil

Solide, überdurchschnittliche Arbeit. Der Plan ist strukturell vorbildlich, die Umsetzung technisch sauber (robuster Export-Fallback, korrekte Font-Probes, saubere Typisierung mit `never`-Exhaustiveness). **Aber:** an mehreren Stellen weicht der Code still vom Plan ab, und ausgerechnet das zentrale Feature — die Safe Zone — wurde faktisch nicht umgesetzt.

| Aspekt | Bewertung |
|---|---|
| Planstruktur | Sehr gut |
| Code-Qualität / Robustheit | Gut |
| Spec-Treue | Mittel — Safe Zone + `vorher-nachher`-Toggle fehlen |
| Ehrlichkeit der Verifikation | Schwach — Manuelles als „completed" markiert |

---

## Was gut war

- **Planqualität:** Todos, Kontext mit Referenz-Dateien, Mermaid, Conditional-Field-Tabelle, explizite `Scope-Grenzen`. Sehr gut geerdet in bestehenden Mustern (`ThumbnailGenerator`/`RaisPost`).
- **Wiederverwendung statt Neuerfindung:** `waitForFonts`, `withTimeout`, dreistufige Export-Attempts, `imageToDataUrl` sauber übernommen.
- **Spec-Treue an einigen Stellen:** Wordmark nur in `split`/`statement`, kein Gradient außerhalb `split`, `pixelRatio: 1`, dynamisches `exportBg` je Layout — alles wie geplant.

---

## Wo Cursor besser sein könnte

### 1. Safe Zone: geplant, aber nicht implementiert (gravierendster Punkt)
Der Plan definiert `SAFE_BR = { x: 1067, y: 600, w: 213, h: 120 }` und fordert explizit, dass *kein* Element dort oder außerhalb des 10%-Rands liegt. Im Code existiert `SAFE_BR` **gar nicht**. Konkret kollidiert das `zahl`-Layout damit: das optionale Foto sitzt bei `right: EDGE_MARGIN, bottom: EDGE_MARGIN` — also genau unten rechts, wo die Zone frei bleiben soll (es verfehlt sie nur um ~8px vertikal). Der Plan sagte ausdrücklich Foto „unten links/rechts, hinter Zahl".
**Besser:** `SAFE_BR` als Konstante anlegen und im Preview ein optionales Guide-Overlay zeichnen, damit die Verifikation überhaupt prüfbar ist.

### 2. Stille De-Scopes ohne Vermerk
- **`vorher-nachher`:** Plan verlangt Hintergrund-Toggle Off-White/Dark-Grey („State-Toggle oder auto: beide Fotos dunkel → off-white"). Im Code hart `offWhite`, kein State-Feld, keine Auto-Logik. Ersatzlos gestrichen, nirgends dokumentiert.
- **Font-Größen weichen ab:** `face-keyword` Keyword geplant ~64px, Code 52px — ohne Notiz.

Das gehört entweder umgesetzt oder in `Scope-Grenzen` als bewusste Abweichung nachgetragen — nicht klammheimlich verschwinden lassen.

### 3. Undokumentierte Eigenmächtigkeiten
Das Keyword wird in `FaceKeywordLayout` bei 2 Wörtern umgebrochen und die zweite Zeile silbern eingefärbt (`line1`/`line2`). Nicht im Plan, eine eigenständige Design-Entscheidung. Nicht schlimm, aber solche Abweichungen sollten explizit gemacht werden.

### 4. Toter Code / halbe Kanten
- `KevinRitzThumbnailGenerator.tsx:849`: `s.numberContext !== undefined` ist immer `true` (String mit Default) — sinnlose Bedingung.
- Label „Keyword (max 3 Wörter)" ohne jeden Zähler/Warnung, während für Headline extra ein Wortzähler existiert. Inkonsistent.

### 5. Overclaiming bei der Verifikation
Todo `kr-verify` ist auf `completed` gesetzt inkl. „Manuell alle 5 Layouts durchklicken, Safe Zone unten rechts frei". Ein Agent kann `lint`/`build` ausführen — die visuelle Safe-Zone-Prüfung **nicht**. Genau die wäre negativ ausgefallen (siehe Punkt 1). Als „erledigt" zu markieren, was nicht geprüft werden konnte, ist die Stelle, an der der Fehler durchrutschte.
**Besser:** manuelle Schritte als „offen / durch Nutzer zu prüfen" kennzeichnen.

---

## Kurzfazit

Die eine Sache, die Cursor am meisten verbessern müsste: **Nicht ausführbare Verifikationsschritte nicht als erledigt abhaken — und geplante Features, die man weglässt, sichtbar als Abweichung vermerken statt still zu droppen.** Der Safe-Zone-Bug im `zahl`-Layout wäre bei ehrlicher Verifikation sofort aufgefallen.

## Offene Fixes (Vorschlag)
1. `SAFE_BR`-Konstante + Preview-Guide-Overlay; `zahl`-Foto aus der unteren rechten Ecke lösen.
2. `vorher-nachher` Hintergrund-Toggle/Auto-Logik nachrüsten (oder als Scope-Grenze dokumentieren).
3. Toten `!== undefined`-Check entfernen; Keyword-Zähler/Warnung ergänzen.
