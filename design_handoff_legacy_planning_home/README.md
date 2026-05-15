# Handoff: LegacyPlanning — Home Screen

## Overview

This is the **home / dashboard screen** for **LegacyPlanning**, an audio-to-text transcription product for meetings, interviews, and voice notes. The home is where a signed-in user lands: it shows a personal greeting with live stats, lets them upload a new audio file (or paste a URL, or record live), and previews recent transcriptions.

Visual language draws from **Replicate's marketing design system** — warm cream canvas, heavy editorial display typography with tight line-height, hot accent color used as a "stamp", and pill-shaped interactive elements everywhere. The accent has been swapped from Replicate orange to **Legacy Blue `#2D5FDE`**.

## About the design files

The file `legacy_planning_home.html` in this bundle is a **design reference created in HTML/CSS**. It is a prototype showing the intended look, layout, copy, and behavior — **not production code to copy verbatim**.

Your job: **recreate this design in LegacyPlanning's existing codebase** (React, Vue, SwiftUI, native, etc.) using its established component patterns, design tokens, and routing/state conventions. If no frontend codebase exists yet, choose the most appropriate framework for the project and implement the design there.

## Fidelity

**High-fidelity.** All colors, font sizes, weights, line-heights, paddings, and radii in this prototype are intentional and should be matched exactly in the production implementation. Use the exact hex values and spacing tokens below.

## Screens / Views

### Screen: Home (this is the only screen in this handoff)

- **Purpose:** User lands here after login. Primary action: upload audio for transcription. Secondary: see what's recently transcribed.
- **Layout:** Two-column grid
  - **Sidebar:** fixed `280px` wide, full height, warm bone background
  - **Main:** remaining width, scrollable, cream canvas

#### Sidebar (`280px`, `var(--surface-bone)` `#f3f0e8`)

Top section:
- Brand row: `30×30` logo mark (LegacyPlanning triangle, asset attached) + wordmark "LegacyPlanning" in Bricolage Grotesque 15px / 700 / letter-spacing −0.3px, ink color. Collapse arrow button on far right (24×24 pill outline).
- `padding: 16px 12px` outer, `4px 6px 18px` on the top row.

Nav list (`GERAL` group label uppercase, mono 10/600, color `#8d8d8d`, padded `14px 10px 8px`):
- Início (active — dark pill background `#202020`, on-dark text)
- Atas
- Tarefas (with `10` badge — pill, secondary fill)
- Histórico
- Planner AI

Each nav item is a **pill** (`border-radius: 9999px`), `9px 12px` padding, 16px icon left, charcoal text default, hover bg `rgba(32,32,32,0.05)`, active = filled dark pill.

Bottom (stuck to bottom of sidebar, separated by 1px hairline):
- Documentação
- Configurações
- User card: 26×26 dark circular avatar with "N", "Novato" name + "Plano gratuito" subtitle below

#### Main content area

**Topbar (64px, sticky, cream background, 1px hairline bottom):**
- Left: breadcrumb "Início" in 13/500 charcoal
- Right: cluster of:
  - Search icon button (36×36 pill outline)
  - Notification bell icon button (36×36 pill outline)
  - User pill: 28×28 LEGACY-BLUE avatar with "LR" initials + "Lair R." name + chevron-down

**Hero band (cream canvas, faint blue radial-mesh decoration at bottom-left and bottom-center):**

Padding `36px 32px 56px`, max-width inside is `980px` centered.

Greeting row (flex, space-between, ends-aligned, wraps at narrow widths):

Left block — `.greeting-block`:
```
Boa tarde, Lair.                          ← Bricolage Grotesque, 32/600, line-height 1.05,
                                            letter-spacing −0.7px, ink. The name "Lair" is 
                                            wrapped in `<span class="you">` and colored with
                                            --primary (Legacy Blue).
Quinta-feira, 14 de maio                  ← Bricolage Grotesque, 20/500, letter-spacing −0.3px,
                                            color --stone (#bbbbbb) — visibly faded.
```

Right block — `.greeting-meta`:
Three inline stats, each is a column (label below number, right-aligned):
- **`2`** processando — number is Bricolage 22/700, color = Legacy Blue (live indicator)
- **`12`** esta semana — same size, ink color
- **`4h·20`** economizadas — same size, ink color

Number labels are mono 12/normal, lowercase, color `--mute` `#646464`.

Below greeting row, **hero headline block**:
- Eyebrow pill: cream-on-card pill with 6px pulsing blue dot + mono microcopy "legacyplanning / v2.4 · pronto"
- H1 — Bricolage Grotesque, **88px / 700 / line-height 1.0 / letter-spacing −3px**. Two lines, each in a separate `<span class="line">` with `white-space: nowrap` so it never wraps mid-line. Responsive: 88px → 68 → 52 → 40 across breakpoints.
  - Line 1: `Sua reunião começa aqui` (ink)
  - Line 2: `E termina por nossa conta` (Legacy Blue accent)
- Subtitle: Inter 19/400, line-height 1.5, `--body` color, max-width 560px.

**Upload section (transitions cream → bone background mid-section):**

Two-column grid (1.45fr / 1fr), max-width 980px:

Left column — **upload-card** (white card, 1px hairline, 16px radius, 24px padding):
- **Pill tab row** (4px bone-filled pill with three buttons):
  - "Enviar arquivo" (active — dark pill filled)
  - "Colar URL"
  - "Gravar agora"
- **Dropzone** — dark `#202020` background, 12px radius, 48×32 padding, inner 1.5px dashed off-white border at 8px inset:
  - 56×56 Legacy Blue pill with white upload icon (6px blue glow)
  - "Arraste o arquivo de áudio aqui" — Bricolage 28/600/−0.6px
  - Formats pill — mono 12, `.mp3 · .wav · .flac · .ogg · até 100MB`
- **Action row** (flex, gap 10):
  - Primary CTA pill — Legacy Blue, white text, 44px tall, 12×22 padding, upload icon + "Escolher arquivo"
  - Secondary outline pill — white bg, ink-strong border, "Ver exemplos"
  - Flex-grow spacer
  - Helper hint — mono 12, mute color, with `⌘` `U` keyboard chips (bone bg, 1px hairline)

Right column — **how-card** (dark `#202020` panel, on-dark text, 16px radius, 26px padding):
- Eyebrow mono "# como funciona"
- Title "Três passos. Sem prompts." (Bricolage 24/600)
- Three numbered steps (24×24 mono pill numbers, 12-14px body)
- Mini code snippet at bottom — pure black `#000` bg, 8px radius, JetBrains Mono 12, syntax-color highlighted curl example

**Recent transcriptions section (bone bg, 48×32 padding):**

Inner 980px centered. Heading row:
- Section title: Bricolage 32/700/−0.7px "Transcrições recentes"
- "Ver tudo →" outline pill (right)

3-column grid of recent cards. Each card: white bg, 1px hairline, 10px radius, 16px padding:
- Status pill (top): "Processando" with pulsing Legacy Blue dot (live), or "Concluído" with success green pill
- Title (Bricolage 17/600/−0.3px)
- Meta row (mono 11, mute): date · speaker count
- Bottom row: clock icon + duration in 12/charcoal, separated by hairline above

**Footer:** cream bg, centered, 28×32 padding, 13px mute-colored links separated by `·` — "Feedback · GitHub · Termos · Privacidade · **Doar**" (Doar colored Legacy Blue).

## Interactions & Behavior

- **Tab toggle:** Clicking any pill tab in the upload card activates it (visual only — three tabs: Enviar arquivo / Colar URL / Gravar agora). In production, each switches the upload card content (file picker / URL input field / audio recorder UI).
- **File drop:** The dropzone should accept drag-and-drop of audio files (mp3, wav, flac, ogg). On hover-while-dragging, highlight the dashed border to Legacy Blue. Max 100MB.
- **CTA "Escolher arquivo":** Triggers the system file picker. Keyboard shortcut `⌘U` / `Ctrl+U` should also open it.
- **Recent card click:** Navigates to the transcription detail view (not in this handoff).
- **Sidebar nav:** Each item navigates to that section. Active state shows a filled dark pill.
- **Greeting "Boa tarde":** Should swap based on local time:
  - 5:00 → 11:59 → "Bom dia"
  - 12:00 → 17:59 → "Boa tarde"
  - 18:00 → 4:59 → "Boa noite"
- **Date:** Should be the user's current locale date in Portuguese, capitalized day-of-week first.
- **Stats:** "Processando", "Esta semana", "Economizadas" should reflect real user data from the API.
- **Status pulsing dot:** `processing` status uses a 1.2s pulse animation (opacity 1 → 0.3 → 1) on the dot.

## State management

- Authenticated user (name, initials) for the topbar and greeting
- Live stats (processing count, this-week count, hours-saved) — likely from a stats endpoint
- Recent transcriptions list (paginated, last 3 shown on home, "Ver tudo →" navigates to full list)
- Current upload tab (file / url / record)
- Drag-over state on dropzone
- Upload progress (not shown in this design — likely a modal or inline progress bar after the user picks a file)

## Design tokens

### Colors

```
--primary:        #2D5FDE   /* Legacy Blue — accent stamp */
--primary-deep:   #1f49b8   /* hover/press */

--canvas:         #f9f7f3   /* warm cream — page background */
--surface-bone:   #f3f0e8   /* sidebar, recent section, mid-tone tile */
--surface-card:   #ffffff   /* white cards */
--surface-dark:   #202020   /* dropzone, how-card, code well, active nav pill */
--surface-deep:   #000000   /* inset code snippet inside how-card */

--hairline:       rgba(32, 32, 32, 0.12)
--hairline-strong: #202020

--ink:            #202020   /* body text, headlines */
--body:           #3a3a3a   /* secondary body */
--charcoal:       #575757
--mute:           #646464
--ash:            #8d8d8d
--stone:          #bbbbbb   /* dimmed labels (date sub-line) */
--on-dark:        #fcfcfc
--on-dark-mute:   rgba(252,252,252,0.72)

--success:        #2b9a66
```

### Typography

Three families:
- **Display:** Bricolage Grotesque (700 weight primary, 500 & 600 used) — Google Fonts. This stands in for Replicate's proprietary `rb-freigeist-neue`. If you have access to the real face, swap it in.
- **Body / UI:** Inter (400, 500, 600, 700) — Google Fonts. Stands in for `basier-square`.
- **Mono:** JetBrains Mono (400, 500) — Google Fonts. Used directly.

| Role | Family | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Hero H1 | Bricolage | 88 → 68 → 52 → 40 (responsive) | 700 | 1.0 | −3px |
| Section title | Bricolage | 32 | 700 | 1.0 | −0.7px |
| Greeting | Bricolage | 32 | 600 | 1.05 | −0.7px |
| Greeting date | Bricolage | 20 | 500 | inherit | −0.3px |
| Dropzone title | Bricolage | 28 | 600 | 1.1 | −0.6px |
| How-card title | Bricolage | 24 | 600 | 1.1 | −0.5px |
| Stat number | Bricolage | 22 | 700 | 1 | −0.5px |
| Recent card title | Bricolage | 17 | 600 | 1.2 | −0.3px |
| Brand wordmark | Bricolage | 15 | 700 | inherit | −0.3px |
| Hero subtitle | Inter | 19 | 400 | 1.5 | 0 |
| Button primary | Inter | 15 | 600 | 1 | 0 |
| Body | Inter | 14 | 400 | 1.5 | 0 |
| Nav item | Inter | 14 | 500 | inherit | 0 |
| Eyebrow / mono caption | JetBrains Mono | 11–12 | 400 | inherit | 0–0.3px (lowercase) |
| Code snippet | JetBrains Mono | 12 | 400 | 1.65 | 0 |
| Step number | JetBrains Mono | 12 | 600 | inherit | 0 |
| Group label sidebar | Inter | 10 | 600 | inherit | 1px (uppercase) |

### Spacing

Base scale (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 96):
- Section padding (vertical): 48–80px
- Card padding: 16–32px
- Inline gap: 8–12px
- Sidebar inner padding: 12–16px

### Radii

| Token | Value | Use |
|---|---|---|
| `r-xs` | 4px | Inline mono chips inside code, keyboard keys |
| `r-sm` | 6px | Mid-radius callouts |
| `r-md` | 8–12px | Content cards (recent-card 10, upload-card 16) |
| `r-lg` | 16px | Larger panels (how-card, upload-card) |
| `r-full` | 9999px | **Everything interactive — buttons, inputs, badges, avatars, pills, nav items, stat chips** |

**Rule:** all interactive elements are pill-shaped. Content cards step to 10–16px. No sharp corners anywhere.

### Shadows / Elevation

The system uses **color-blocking** rather than shadows for elevation:
- Cream canvas → bone tile → white card → dark code-well = the elevation ladder.
- Soft drop `0 8px 24px rgba(32,32,32,0.08)` on hovered recent cards only.

## Assets

| File | Use |
|---|---|
| `assets/legacy-mark.png` | LegacyPlanning triangle mark, 509×509 PNG with 15% padding around the mark. Use in sidebar brand row (rendered 30×30) and anywhere else the brand mark appears small. |
| `assets/legacy-planning-logo.png` | Original wide logo (1208×330) with the wordmark portion in white (invisible on white backgrounds). Use only on dark surfaces, or re-render the wordmark in Bricolage Grotesque as I did in the sidebar. |

A clean SVG version of the mark would be ideal — please commission one from your designer when possible.

## Responsive behavior

| Breakpoint | Behavior |
|---|---|
| ≥ 1180px | Default — H1 at 88px, upload-grid 1.45fr / 1fr |
| < 1180px | H1 shrinks to 68px (`-2px` tracking) |
| < 920px | Upload-grid collapses to single column, H1 → 52px |
| < 720px | H1 → 40px |
| Mobile (TBD) | The sidebar should collapse to a hamburger drawer. Topbar stays sticky. Greeting and hero stack 1-up. Stats wrap to 2 columns or stack. Recent grid stacks 1-up. **The mobile design is not in this prototype — design it consistent with the spirit of the desktop version: cream canvas, pills everywhere, generous editorial spacing, Legacy Blue used scarcely.** |

## Files in this bundle

- `legacy_planning_home.html` — the design reference (open in a browser to see the live prototype)
- `assets/legacy-mark.png` — square brand mark with padding (use for sidebar / favicons / small contexts)
- `assets/legacy-planning-logo.png` — full original logo with wordmark (the wordmark is white — use on dark only)

## Implementation notes

- Use **CSS variables** for the color tokens (or your codebase's equivalent — Tailwind config, theme provider, etc.).
- The **pill-everything rule** is non-negotiable for interactive elements. Sharp-corner buttons will break the brand vibe immediately.
- **Legacy Blue is scarce.** Use it ONLY for: primary CTA, the accent word in headlines (e.g. "Lair" in greeting, "E termina por nossa conta" line), the live status indicators, and inline links. If you find yourself painting a big surface in blue, stop.
- **Bricolage Grotesque needs `line-height: 1.0`** on display sizes to look right. Loosen it and you lose the editorial cadence.
- **Don't replace cream with pure white at the page level.** White is for individual cards only.
- **The "you" name accent in the greeting** should pull from the authenticated user — if the user is "Carlos", the greeting becomes "Boa tarde, Carlos." with "Carlos" in blue.
