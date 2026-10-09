# Opportunity Hunter — Stitch Design System (2026-10-09)

Source: Google Stitch export, supplied by Megah. Authority for all UI screens.

## Colors
- Canvas: #0f1117 | Cards: #171a23 | Hover surface: #1f2330
- Border: #2a2f42 | Focus ring: rgba(108,140,255,0.45)
- Primary (Electric Indigo): #6c8cff, hover #829eff, text on primary #0f1117
- Success: #4ade80 | Warning: #f59e0b | Danger: #ef4444
- Text primary: #f3f4f6 | secondary: #9ca3af | disabled: #4b5563

## Score tiers (Opportunity Matrix Bar)
- 71–100 High (green), 41–70 Medium (amber), 0–40 Low (red)
- Bar: 6px height, 9999px radius, track #1f2330

## Badges
- High: bg rgba(74,222,128,.12), text #4ade80, border rgba(74,222,128,.25)
- Medium: bg rgba(245,158,11,.12), text #f59e0b, border rgba(245,158,11,.25)
- Low: bg rgba(239,68,68,.12), text #ef4444, border rgba(239,68,68,.25)
- Pills: 9999px radius. Running states: 6px dot + pulse animation.

## Typography
- Inter everywhere. Tabular nums for metrics: font-variant-numeric: tabular-nums.
- Cards/inputs/buttons radius 12px. Layout max-width 1100px, mobile-first.

## Buttons
- Primary: bg #6c8cff, fg #0f1117, radius 12px.
- Ghost: bg rgba(42,47,66,.4), border #2a2f42, hover #1f2330.
- Destructive: border+text #ef4444, bg rgba(239,68,68,.08).

## Inputs
- bg #171a23 (note: generated dashboard HTML used #10131b for inset depth — kept),
  border #2a2f42, radius 12px, focus border #6c8cff + 0 0 0 3px rgba(108,140,255,.2).

## Cards
- bg #171a23, border #2a2f42, radius 12px, padding 1.25rem,
  hover border #3b425d, transition 150ms ease-out.
