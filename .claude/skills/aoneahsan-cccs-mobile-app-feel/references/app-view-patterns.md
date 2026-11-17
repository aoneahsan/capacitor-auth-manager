# App-view patterns

Tokens, not literals: every size, radius and colour below comes from the project's design tokens
(`aoneahsan-cccs-tailwind-v4`). The numbers are the floor.

## Layout skeleton (a landing/home page)

```
┌──────────────────────────────┐  ← env(safe-area-inset-top)
│ [logo] Product      (☾) (≡)  │  top app bar, 56 px, sticky, blurred background
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ One-sentence promise     │ │  hero card, full-bleed, rounded, 1 illustration
│ │ [ Start with you ]       │ │  primary action ≥ 48 px high
│ └──────────────────────────┘ │
│  ◀ card │ card │ card ▶      │  scroll-snap row, 85 % width cards, peek of the next
│   • ○ ○                      │  dots = buttons, aria-label "Moment 2 of 3"
│ ┌──────────────────────────┐ │
│ │ Why it is different      │ │  2–3 stacked cards, each one idea
│ └──────────────────────────┘ │
│ ▸ About, legal and more      │  collapsed footer (disclosure)
├──────────────────────────────┤
│ [ Create your free account ] │  sticky thumb-zone CTA (signed out)
│  Home  Features  Plans  Me   │  bottom tab bar
└──────────────────────────────┘  ← env(safe-area-inset-bottom)
```

## Behaviour

| Pattern | Rule |
|---|---|
| App bar | Sticky; shrinks on scroll only with reduced motion off; the theme control stays one icon |
| Cards row | `overflow-x: auto; scroll-snap-type: x mandatory`; keyboard: arrows move, Tab reaches each card; no auto-advance |
| Sticky CTA | Hidden while the hero CTA is on screen (IntersectionObserver), so the same action never shows twice |
| Bottom bar | Same destinations as the shell's bar for signed-out users; current item marked with `aria-current` |
| Sheets | React Aria `Modal` + `Dialog`; drag handle is decorative; focus returns to the trigger |
| Press feedback | `:active` scale 0.98 or a tint, within 100 ms; `transform`/`opacity` only |
| Motion | Entrances ≤ 250 ms, one per viewport; nothing moves with `prefers-reduced-motion: reduce` |
| Safe areas | Padding from `env(safe-area-inset-*)` on the bar, the CTA and the tab bar; Capacitor edge-to-edge per `capacitor-plugins-and-issues.md` |
| Text | Body ≥ 16 px, never zoom-blocked; line length ≤ 40 characters in cards |

## Verification

- 390 × 844 with touch emulation: app view, no horizontal scroll, the CTA reachable, and the tab bar clear of
  the home indicator.
- 1440 × 900: web view, unchanged from before the split.
- A desktop window at 390 px wide, mouse pointer: web view, responsive.
- The Capacitor build: app view.
- Lighthouse-style numbers on the built output: CLS ≤ 0.1, LCP within budget, and a first-load budget no
  larger than before (the app view is its own chunk).
