---
name: Obsidian Scholar
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
    letterSpacing: 0em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a high-density, performance-driven academic environment built for scholars, researchers, and technical students. The emotional tone evokes calm mastery, intense intellectual focus, and precision. It blends the ruthless efficiency of modern engineering tools with refined academic discipline.

The visual style unites **Technical Glassmorphism** with **Engineered Minimalism**:
- Translucent dark slate surfaces floating above a deep void (#090D16).
- Sub-pixel structural hairpins (1px #334155 borders) giving mechanical clarity to every container.
- Concentrated luminescent accents (electric indigo, violet, cyan) deployed strictly as functional indicators, telemetry gauges, and focus markers.
- Information architecture optimized for keyboard-first navigation, instant command palettes, and glanceable quantitative metrics.

## Colors

The system uses a dark-mode-native foundation engineered for sustained optical comfort during deep analytical work.

### Base Canvas & Surfaces
- **Canvas Base:** `#090D16` (Deep Obsidian Void)
- **Layer 1 Surface (Sidebar, Base Panels):** `#0F172A` (Deep Slate)
- **Layer 2 Card/Modal (Frosted Slate):** `rgba(30, 41, 59, 0.7)` with `backdrop-filter: blur(12px)`
- **Layer 3 Elevated/Hover Surface:** `#1E293B`
- **Border / Structural Stroke:** `#334155` (Subtle Hairline)
- **Border Focus / Interactive Stroke:** `rgba(99, 102, 241, 0.6)`

### Semantic Accents
- **Primary / Focus:** `#6366F1` (Electric Indigo) — primary actions, active states, active tab indicators.
- **Secondary / Computation:** `#8B5CF6` (Vivid Violet) — research graphs, citations, secondary telemetry.
- **Tertiary / Data Streams:** `#06B6D4` (Cyan) — progress trackers, code blocks, sync status.
- **Grade Exceptional / Success:** `#10B981` (Emerald) — 4.0/A+ achievements, passed verifications.
- **Grade Pending / In-Review:** `#F59E0B` (Amber) — queued submissions, pending reviews, deadlines within 7 days.
- **Urgent / Warning:** `#F43F5E` (Rose) — impending deadlines (<24h), critical academic alerts, failed builds.

### Text Contrast Tiers
- **Text High-Contrast:** `#F8FAFC` (Titles, primary data points)
- **Text Muted:** `#94A3B8` (Metadata, descriptive labels, secondary metrics)
- **Text Subtle:** `#64748B` (Keybindings, disabled states, grid marks)

## Typography

The typography strategy leverages **Geist** for crisp structural layout and extreme density tolerance, complemented by **JetBrains Mono** for technical data points, keyboard shortcuts, timestamps, and grade metrics.

- All letter-spacings for headlines are pulled tight to maintain visual cohesion at large scales in dark viewports.
- All numbers representing grades, GPA, credits, and timing must render using `font-variant-numeric: tabular-nums` to preserve vertical alignment across data lists.
- Monospaced tags and command badges should always be typeset in uppercase or standardized sentence case with slight positive tracking (+0.02em to +0.04em).

## Layout & Spacing

The layout is built on a high-density, flexible workbench model:
- **Desktop Grid:** 12-column adaptive fluid grid with 24px (`1.5rem`) gutters and a fixed 260px collapsible command rail. 
- **Workspace Canvas:** Uses compact internal spacing rules (`space-sm` for list items, `space-md` for card padding, `space-lg` for module sectioning) to minimize scroll requirements and maximize viewport data density.
- **Breakpoints:**
  - Mobile (`< 768px`): Single column reflow, sidebars convert to an overlay drawer, bottom fixed quick-action bar replaces the header command palette trigger.
  - Tablet (`768px - 1180px`): Collapsed icon-only command rail, 6-column content split.
  - Desktop (`> 1180px`): Full two or three-pane master-detail layout (Navigation Rail, Primary Feed/Editor, Contextual Inspector).

## Elevation & Depth

Depth is established strictly via frosted glass layering, precise sub-pixel rims, and inner glow halos rather than heavy drop shadows:

- **Level 0 (Canvas):** Pure `#090D16`, no border, no shadow.
- **Level 1 (Panels & Sidebar):** Solid `#0F172A` with a right or left 1px border of `#1E293B`.
- **Level 2 (Cards & Modules):** `rgba(30, 41, 59, 0.65)` with `backdrop-filter: blur(14px)`, framed in `1px solid #334155`.
- **Level 3 (Popovers, Command Palette, Modals):** `rgba(15, 23, 42, 0.85)` with `backdrop-filter: blur(20px)`, framed in `1px solid rgba(99, 102, 241, 0.4)`, accented by a subtle, diffused indigo halo: `box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.2), 0 20px 40px -15px rgba(0, 0, 0, 0.7)`.
- **Level 4 (Telemetry Highlights & Radial Meters):** Elements such as score rings emit radial localized glows: `drop-shadow(0 0 8px currentColor)`.

## Shapes

The shape system adopts a sharp, architectural posture (`roundedness: 1`):
- Standard interactive elements (buttons, text fields, menu options, task lists) use `0.25rem` (4px) corner radii.
- Structural cards, modals, and panel groups use `0.5rem` (8px) corner radii.
- Status indicators, command keys, and academic badges explicitly break this rule to form geometric pill badges (`rounded-full` / 9999px) to establish immediate categorical distinction from rectangular data containers.

## Components

### Buttons
- **Primary:** Solid `#6366F1` background, `#FFFFFF` text, 4px border radius. On hover: `#4F46E5` with `box-shadow: 0 0 12px rgba(99, 102, 241, 0.45)`.
- **Ghost/Command:** Transparent background, `#94A3B8` text, 1px solid transparent. On hover: `rgba(255, 255, 255, 0.05)` background, `#F8FAFC` text, 1px solid `#334155`.
- Height: 32px standard, 26px compact (density-first).

### Command Palette (Raycast-Inspired)
- Centered overlay modal (`width: 640px`) with Level 3 frosted elevation.
- **Search Header:** 48px height, unbordered input, `#F8FAFC` text, placeholder `#64748B`, left-aligned `Cmd + K` visual glyph.
- **Results Rows:** 36px height, single-line text with trailing shortcut pills. Selected row receives `rgba(99, 102, 241, 0.15)` background and a left 2px `#6366F1` accent strip.

### Pill Badges & Chips
- **Status Pills:** Pill-shaped (`border-radius: 9999px`), padding `2px 8px`, typography `label-sm`.
  - *Emerald (Top Tier / 4.0):* `background: rgba(16, 185, 129, 0.12)`, `border: 1px solid rgba(16, 185, 129, 0.3)`, `color: #10B981`.
  - *Amber (Pending):* `background: rgba(245, 158, 11, 0.12)`, `border: 1px solid rgba(245, 158, 11, 0.3)`, `color: #F59E0B`.
  - *Rose (Urgent Deadline):* `background: rgba(244, 63, 94, 0.12)`, `border: 1px solid rgba(244, 63, 94, 0.3)`, `color: #F43F5E`.
- **Kbd / Keybinding Badges:** JetBrains Mono, 10px, background `#1E293B`, border `1px solid #334155`, text `#94A3B8`, padding `1px 5px`, rounded `3px`.

### Radial Score Rings
- SVG-driven circular telemetry gauges displaying grade percentiles, course completion, or research hours.
- Background track: `stroke: #1E293B`, stroke width `3px`.
- Metric track: `stroke: #6366F1` (or `#10B981` if grade >= 90%), stroke width `3px`, `stroke-linecap: round`.
- Glow implementation: `filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.5))`.
- Center label: JetBrains Mono tabular numeral.

### Lists & Row Items (Linear-Inspired)
- Horizontal rows separated by hairline border `1px solid rgba(51, 65, 85, 0.4)`.
- Hover trigger applies a unified wash: `background: rgba(30, 41, 59, 0.5)`.
- Left-aligned indicator dots (3px diameter) indicating status or assignment weight.

### Input Fields & Controls
- **Inputs:** Height 34px, background `rgba(15, 23, 42, 0.6)`, border `1px solid #334155`, text `#F8FAFC`, typography `body-md`. Focus applies `border-color: #6366F1` and `outline: 1px solid #6366F1`.
- **Checkboxes:** 14px × 14px, corner radius 2px, border `1px solid #475569`. Checked state transitions to `#6366F1` background with white checkmark.