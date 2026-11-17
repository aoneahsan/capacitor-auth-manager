# Design system for store assets

How to turn a project's own UI into store graphics. Every number here is the Rent Party reference set
(2026-10-27); scale them if a project's canvas or frame differs, but keep the relationships.

## 1. Read the project, do not invent

| Need | Where it usually lives | Rent Party example |
|---|---|---|
| Palette | `src/styles/tokens.css` (or the theme file / Flutter `ColorScheme`) — read the hex comments | `--color-band-night #33182d`, `--color-accent #c231ac`, `--color-on-night #f9f1f7`, `--color-night-accent #f190dd` |
| Display + body fonts | `public/fonts/*.woff2` (often variable), named in the CSS | Grandstander (display), Atkinson Hyperlegible Next (body) |
| Brand mark | `public/favicon.svg`, the header lockup | house mark with three dice pips |
| Product art | `src/assets/**` illustration folders | `tokens/`, `buildings/`, `cards/` |
| Approved words | `docs/story/drafts/store-listing.md` (GATE 4) | `store.graphic.line`, `store.shot.home` … |
| Seat / category colours | extra token groups | `--color-seat-1…8` used for tile bands and confetti |

Pick the **strongest band** for the background: the darkest brand surface with light text on it (a "night" or
"ink" band). A pale page colour vanishes against Play's white page. Add one radial glow in the accent colour at
~55–60% opacity behind the subject. Confetti dots in category colours at 55% opacity, 4–10 px radius, kept to the
corners.

## 2. The lockup

Mark + name on one line, the approved line underneath, always as **one group** scaled together, so the header
proportions survive. Text is outlined to paths (no font needed at export). Name in the on-band colour, the line in
the band's accent colour.

- Feature graphic: lockup on the left half, scale chosen so its right edge clears the scene by ≥ 40 px.
- Brand shot: lockup centred, about 87% of the canvas width (940 of 1080), its top around y 110.

Measure before placing: the outlined paths' extent × scale is the width. A lockup that collides with the scene is
the first failure seen in practice.

## 3. The feature-graphic scene (right half)

Draw the product, not a picture of a phone: three rounded "property" tiles fanned at −11° / 0° / +10°, each with a
category-colour band and one of the product's own building icons, two dice below, and 2–3 of the product's own
character tokens around them. All art is the project's existing SVG, inlined unchanged (`<svg x y width height
viewBox>` nested). Soft shadows: the same shape offset (5, 9) in a near-black at 45%. Keep everything ≥ 20 px from
the edges.

## 4. The phone frame (every screenshot)

| Part | Value at 1080 × 1920 |
|---|---|
| Screen | 756 × 1344 (0.7 of the canvas), centred, top at y 480, `rx` 54, capture clipped to it with `preserveAspectRatio="xMidYMid slice"` |
| Bezel | screen + 22 px each side, `rx` 76, fill near-black of the band hue (`#1a0b17`), 4 px stroke in a muted band tone (`#5c3b55`) |
| Shadow | the bezel shape offset (8, 16), `#140910` at 55% |
| Headline zone | y 0–460; text block centred on y 250 |

## 5. Headlines

- Display font at a heavy weight (Grandstander 800), 84 px, line height 1.16, centred, on-band colour.
- **Balanced wrap**: the fewest lines that fit 960 px, then the split that minimises the longest line, so no line
  ends with a single orphan word. Shrink by 4 px only when more than three lines would be needed.
- Shot 1 uses the lockup instead of a headline.

## 6. Decoration placement

Two of the product's own tokens per shot, 130 px, rotated −14…+14°, **fully in the side margins** (x 10 or x 940),
one high (y ≈ 540–640), one low (y ≈ 1640–1650). Never over the screen, never over the headline. Vary the pair
across shots so the set reads as a family, not a repeat.

## 7. Icon

The launcher icon as Android shows it: the brand mark on the page colour, 512 × 512, from the same SVG the app's
adaptive icon uses. Improve it only by improving the mark itself in the app first.

## Feature-explainer shots (the default since 2026-11-09)

🔴 **Every project, every set** (owner, 2026-11-09: *"have best features explained for that project … fully custom
designed and great looking"*; his words in full in `rules-detail/store-listing-assets.md`). First set by LifeWell
OD-126, 2026-10-29: he rejected the framed captures, *"explain features, no need to use exact screenshots from app"*.
Shot 1 is the brand shot and goes to him first; shots 2–8 follow his approval, one feature each. A real, current
capture may fill the frame when it shows the feature better than a drawn screen. Otherwise shots are drawn explainers: the approved caption, one sentence of the approved full description, and an illustration built from the
project's own tokens, icon paths (read from its source) and its own UI strings, with fixture names. Only a feature
the app has. Each explainer passes the custom-made swap, read-aloud and looking tests before it is shown.

How LifeWell built it: one heredoc that outlines Georgia and Noto Sans with fontTools, reads the icon paths from the app's
`src/config/nav.ts` and `src/components/ui/icons*.tsx`, converts the dusk OKLCH tokens to sRGB, and writes eight SVG
masters (cards, avatars, pills, a tree, a mic) that export with the pack's own `rsvg-convert` command.


## Feature-explainer shots: the worked method (Waylock, 2026-11-09, approved by the owner)

Reference set: private repo `aoneahsan/waylock`, `app-publish-assets/screenshots/phone/` and `docs/play-store/STORE-LISTING.md`
(a native Kotlin/Compose app, no browser shell, no device: every screen drawn).

1. **Pick eight screens every user reaches, then strike** any that shows another company's name (a "Choose with
   Google" button, "Open in Google Maps"), a plan-only feature (Trip, locked route), a banned store word ("AI", "free")
   or an admin control. Take the next screen; never blur or edit one out. Eight different screens, no repeat.
2. **Headlines need no new copy:** each is a sentence (or clause) of the approved full description, or the screen's
   own shipped heading or label. Only when neither exists does a caption go through the story system and Gate 4.
3. **Draw from the source, not memory:** read the screen's composable or component for element order, spacing and
   tones; its string file for every word; the theme file for colours, type scale, radii and control height. Render at a
   real phone width (375 dp → 2.016 px/dp on the 756 px screen), with fixture data that tells the feature's story
   (a held third stop, a ticked "visit before") and no PII. The phone may run off the bottom edge.
4. **Explain in the margin:** one orange badge with the feature's own icon, its pointer touching the exact row; a quiet
   route or token motif on the other side (numbered stops, the held one marked). Never on the screen.
5. **Fix the app when the drawing exposes a defect** (an undefined text style falling back to the system font,
   off-centre tab labels, a banned option), in the same pass, gates green, so the image and the app agree.
6. **Export:** `rsvg-convert -w 1080 -h 1920 -b '<band hex>'` per SVG; the band background removes alpha. Prove the
   round trip pixel-identical and look at a contact sheet before showing anyone.

## Common mistakes (moved verbatim from SKILL.md, 2026-11-02)

| Mistake | What happens | Instead |
|---|---|---|
| Light page colour behind everything | Disappears on Play's white page | The brand's darkest band + a soft accent glow |
| Lockup squeezed beside the art | Name collides with the scene | Measure the text width; scale the lockup as one group |
| Greedy line wrap | Orphan words, lines off-canvas | Balanced wrap that checks every line's width |
| Framing a 2-week-old capture | Shot contradicts the app; review rejection | Diff the capture's strings against the app's i18n first |
| Same capture in the brand shot and a later shot | A wasted slot | Use the freed slot for another real screen |
| Relative `<image href>` exported directly | Empty frame (the renderer cannot load it) | Inline the PNG as a data URI at export |

## Portfolio project listings (moved verbatim from SKILL.md, 2026-11-02)

- 🔴 **Portfolio project listings** (owner, 2026-10-28: *"create their best custom designed image assets to go with each
  project listing … make that the default standard"*): every product card on a portfolio site (aoneahsan.com
  `/projects`, zaions.com) gets the same bar — a 1280×800 brand card in that product's own palette, mark and type, plus
  fresh framed captures of its live product at 1440 (browser frame) and 390 (phone frame). Words are the product's own
  name and one line from its live hero; no other words.
