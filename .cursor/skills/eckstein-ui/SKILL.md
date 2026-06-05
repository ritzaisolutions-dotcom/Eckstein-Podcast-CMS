---
name: eckstein-ui
description: Eckstein Podcast CMS UI — Dark Liquid Glass design system. Use when building or editing CMS pages, components, Content Hub, Sidebar, forms, or any visual change in this repo.
---

# Eckstein CMS UI

## Aesthetic

**Dark Liquid Glass** — Navy gradient background, frosted cream panels, gold accents. Extends the login screen aesthetic across the CMS.

- **Never use sans-serif** — Cinzel (headlines/buttons), Cormorant Garamond (subheads), EB Garamond (body/inputs/tables)
- **Login stays** full navy (`.login-screen`) — CMS uses `.cms-shell`

## Tokens (globals.css)

| Token | Use |
|-------|-----|
| `--navy`, `--gold`, `--cream` | Brand |
| `--glass-bg`, `--glass-bg-strong` | Panel fill |
| `--glass-border`, `--glass-border-subtle` | Borders |
| `--text-on-glass`, `--text-on-glass-muted` | Text on dark/glass |
| `--cms-bg-gradient` | App background |

## Utility classes

| Class | Use |
|-------|-----|
| `.cms-shell` | Wrap CMS app chrome — sets dark semantic overrides |
| `.cms-glass` | Sidebar, board columns |
| `.cms-glass-strong` | Cards, modals, active nav |
| `.cms-glass-hover` | Interactive cards |
| `.cms-glass-column` | Kanban column |
| `.cms-glass-title` | Section labels (gold, uppercase Cinzel) |
| `.cms-glass-nav-active` / `.cms-glass-nav-item` | Sidebar links |
| `.cms-dot-off` / `.cms-dot-scheduled` / `.cms-dot-live` | Platform status |

Legacy `.cms-card`, `.cms-table`, `.cms-input`, `.cms-label` auto-adapt inside `.cms-shell`.

## Content Hub UX rules

1. **One mental model:** Wo steht es? · Was fehlt? · Was ist heute dran?
2. **Max 7 elements per card:** title, EP#, type badge, 1–3 platform dots, date, CTA
3. **Scan → Act → Confirm** — inline lifecycle + posted toggle, not full-form saves
4. **DE labels in UI**, EN keys in DB (`lib/lifecycle.ts` when added)
5. **Mobile:** Table default; Board from `md` breakpoint

## Platform matrix (per content type)

| Type | Platforms |
|------|-----------|
| lfc | youtube, spotify |
| sfc | youtube, tiktok, instagram |
| article | website |
| social_post | instagram |

## Platform dot states

- **off** (○ grey) — no URL / inactive
- **scheduled** (◐ gold) — URL or schedule, not posted
- **live** (● green) — `postedAt` set

## Do not

- Purple gradients, Inter/Roboto, generic AI slop
- Cream-first background in CMS (cream is accent on glass, not page bg)
- New sans-serif fonts
- Duplicate platform rules outside `lib/platforms.ts`

## Reference

- Design preview: `/design-preview`
- Plan: Content Hub Glass Redesign
