# Capacitor Auth Manager brand kit

> **Interim kit.** The mark below is a shield with a keyhole, a shape many security and sign-in products use. This
> kit reproduces it faithfully because it is the mark the product shows today; it is not a distinctive, ownable mark.
> When the product gets its own mark, every file here is rebuilt from it.

Drawn from the **live header** of the docs site, `https://capacitor-auth-manager-docs.aoneahsan.com/`, read at
1440 × 900 on 2026-11-08 (the package has no other website; npm and GitHub only link here). Source:
`capacitor-auth-manager-docs/docusaurus.config.ts` (`navbar`) and `src/css/custom.css`.

**The header brand** (`.navbar__brand`): the 32 × 32 px `static/img/logo.svg` at 16 px from the left of a 60 px bar,
then **Capacitor Auth Manager** at x 56 in 16 px, weight 700. The name's cap height is centred on the shield. The
same file is used in light and dark (`srcDark` points at it). Bar: `#FFFFFF` light (the default mode), `#242526`
dark; the name `#1C1E21` light, `#E3E3E3` dark.

**The mark** (`static/img/logo.svg`, 64 grid): a shield filled with a diagonal gradient `#6366F1` to `#A855F7`
(the tokens' `--ifm-color-primary-light` and `--ifm-color-secondary`), a white keyhole (a 7-unit circle and a
tapered slot), and a 3-unit dot of the gradient in the circle. It is not taken from an icon library: it is a
hand-drawn SVG in the docs repo. The screen files keep it exactly, gradient included.

**The font.** `custom.css` sets `--ifm-font-family-base: 'Inter', system-ui, …`, but the site never loads Inter, so
each visitor sees Inter only if it is installed; on this machine the header painted the system fallback. The kit
uses the face the tokens name: Inter 5.3.0 (`@fontsource/inter`, OFL-1.1), 700 for the name, 400 for the line,
shaped with HarfBuzz (kerning on) and outlined to paths. No file here needs a font.

**The line** on the tagline files is the live home hero line, word for word:
`Firebase-agnostic Google sign-in for web and Capacitor — one API on web, iOS, and Android.` Source: `tagline` in
`docusaurus.config.ts`, rendered as the hero `<p>` on the home page. There is no Story Bible for this project. The
line is broken at the dash and after "sign-in" so the three lines are close in length.

## Where the marks differ

This kit follows the header. None of the files below is changed by it.

- **Favicon** (`static/img/favicon.svg`): its own 32-grid shield with a solid white keyhole circle (`r 3.6`) and no
  inner dot. Differs.
- **Social card** (`static/img/social-card.svg`): a wider shield (`200 × 256`, against the header's `44 × 56`) with
  no inner dot. Differs.
- **README logo and npm page:** both show `static/img/logo.svg` by URL, the header file. Same.
- **Docs logo:** the header itself. Same.
- **Font:** Inter is declared but never loaded (above).
- There is no app, Capacitor `resources/` folder or launcher icon (this is a package), so the splash files follow the
  header and the docs site's page colours.

## Screen set

Run each command inside this folder.

| File | Use | Command |
| --- | --- | --- |
| `mark.svg`, `mark.png` | The header mark alone, its own 64 grid, 1024 px, transparent | `rsvg-convert -w 1024 -h 1024 mark.svg \| convert - -define png:exclude-chunks=date,time PNG32:mark.png` |
| `favicon.svg` | Browser tab: the header mark (not the site's current favicon) | Master |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Tab fallbacks | `for s in 16 32 48; do rsvg-convert -w $s -h $s favicon.svg \| convert - -define png:exclude-chunks=date,time PNG32:favicon-$s.png; done` |
| `favicon.ico` | Older browsers and crawlers (16, 32, 48) | `convert favicon-16.png favicon-32.png favicon-48.png favicon.ico` |
| `apple-touch-icon.svg`, `apple-touch-icon.png` | iOS home screen, 180 px, opaque white, square (iOS rounds it) | `rsvg-convert -w 180 -h 180 apple-touch-icon.svg \| convert - -alpha off -define png:exclude-chunks=date,time PNG24:apple-touch-icon.png` |
| `in-app-logo.svg`, `in-app-logo.png` | The brand as it sits in the light header: 60 px bar `#FFFFFF`, 16 px inset, name `#1C1E21`; PNG at 2× | `rsvg-convert -h 120 in-app-logo.svg \| convert - -alpha off -define png:exclude-chunks=date,time PNG24:in-app-logo.png` |
| `logo-horizontal.svg`, `logo-horizontal.png` | Mark left, name right, header geometry, light grounds | `rsvg-convert -h 256 logo-horizontal.svg \| convert - -define png:exclude-chunks=date,time PNG32:logo-horizontal.png` |
| `logo-horizontal-mono.svg`, `logo-horizontal-mono.png` | One colour, `#1C1E21`: the keyhole cut out of the shield, the dot kept | `rsvg-convert -h 256 logo-horizontal-mono.svg \| convert - -define png:exclude-chunks=date,time PNG32:logo-horizontal-mono.png` |
| `logo-horizontal-reversed.svg`, `logo-horizontal-reversed.png` | Dark grounds: the mark unchanged, name `#E3E3E3` (the dark header's) | `rsvg-convert -h 256 logo-horizontal-reversed.svg \| convert - -define png:exclude-chunks=date,time PNG32:logo-horizontal-reversed.png` |
| `logo-stacked.svg`, `logo-stacked.png` | Mark (96 px box) above, name (24 px) below, light grounds | `rsvg-convert -w 1024 logo-stacked.svg \| convert - -define png:exclude-chunks=date,time PNG32:logo-stacked.png` |
| `logo-stacked-tagline.svg`, `logo-stacked-tagline.png` | Mark, name, and the line in the hero's `--ifm-color-emphasis-700` `#444950` | `rsvg-convert -w 1024 logo-stacked-tagline.svg \| convert - -define png:exclude-chunks=date,time PNG32:logo-stacked-tagline.png` |
| `splash-light.svg`, `splash-light.png` | Launch screen, 2732 px, the mark box (640 px) centred on `#FFFFFF` | `rsvg-convert -w 2732 -h 2732 splash-light.svg \| convert - -alpha off -define png:exclude-chunks=date,time PNG24:splash-light.png` |
| `splash-dark.svg`, `splash-dark.png` | Launch screen, 2732 px, centred on the dark page `#0B1220` | `rsvg-convert -w 2732 -h 2732 splash-dark.svg \| convert - -alpha off -define png:exclude-chunks=date,time PNG24:splash-dark.png` |

Colours, from `src/css/custom.css` and Infima's defaults as the live site paints them:

| Token | Light | Dark |
| --- | --- | --- |
| Mark gradient start, `--ifm-color-primary-light` (light) / `-primary-dark` (dark) | `#6366F1` | `#6366F1` |
| Mark gradient end, `--ifm-color-secondary` | `#A855F7` | `#A855F7` |
| Header name, `--ifm-navbar-link-color` | `#1C1E21` | `#E3E3E3` |
| Header bar, `--ifm-navbar-background-color` | `#FFFFFF` | `#242526` |
| Page, `--ifm-background-color` | `#FFFFFF` | `#0B1220` |
| Hero line, `--ifm-color-emphasis-700` | `#444950` | (not used) |

## Print set (`print/`)

For jerseys, T-shirts and any printer. 5 layouts × 4 colourways = 20 logos, each
`<layout>-<white|black|color-dark|color-light>` as SVG master, PDF and transparent PNG (4096 px on the long side,
300 dpi). Flat fills only, no outline around anything, text outlined, no strokes, nothing to install. Every file has
the same clear margin on all four edges: 15% of the shield's height, measured from the outlines, not the type's
advance. Run the command inside `print/`.

**The flat mark.** The screen mark's gradient cannot print flat, so the print mark is the same shield, keyhole and
dot in one brand colour, `#6366F1`: the gradient's first stop, and the one colour present in the mark and in both
themes' primary ramps. The shape is unchanged. In one colour the keyhole is cut out of the shield and the dot is kept,
so the cloth shows through the keyhole; in the colour ways the keyhole is printed white.

| Layout | What | Smallest print width |
| --- | --- | --- |
| `icon` | The shield alone | 8 mm (the slot's foot 0.4 mm) |
| `horizontal` | Shield left, name right, the header's proportions | 41 mm (name cap height 2 mm) |
| `stacked` | Shield above, name below | 36 mm (name cap height 2 mm) |
| `horizontal-tagline` | Shield left, name and line right; the shield runs from the name's cap line to the line's last baseline | 68 mm (line cap height 1.7 mm, thinnest stem 0.2 mm) |
| `stacked-tagline` | Shield, name, line stacked | 53 mm (line cap height 1.7 mm, thinnest stem 0.2 mm) |

Below its smallest width, a tagline layout drops to the same layout without the line, and a name layout to `icon`.

| Colourway | Cloth | Colours |
| --- | --- | --- |
| `white` | Black or dark, back panels | `#FFFFFF` only (keyhole cut out) |
| `black` | White or light, back panels | `#000000` only (keyhole cut out) |
| `color-dark` | Black, dark or painted fronts and shoulders | Shield and dot `#6366F1`, keyhole, name and line `#FFFFFF` |
| `color-light` | White or light fronts and shoulders | Shield and dot `#6366F1`, keyhole `#FFFFFF`, name and line `#1C1E21` |

- Never add an outline to make a logo readable. Pick the colourway for the cloth. On busy art, the art gives way
  behind the logo.
- PDFs are vector and sRGB. Match the hex values with your printer; no Pantone number has been assigned.
- A `white` PDF looks empty in most viewers, which paint a white page under it. The artwork is there.
- The line names other companies' products (Google, Firebase, Capacitor, iOS, Android) as words, as the live hero
  does. No other company's logo appears in any file.

```bash
for f in *.svg; do b=${f%.svg}; rsvg-convert -f pdf "$f" -o "$b.pdf"; rsvg-convert -a -w 4096 -h 4096 "$f" | convert - -define png:exclude-chunks=date,time -units PixelsPerInch -density 300 "PNG32:$b.png"; done
```

Check the rules: `grep -liE 'gradient|filter|opacity|stroke|<image|mask|clip|<text' *.svg` prints nothing, and
`grep -oE 'fill="#[0-9A-Fa-f]+"' stacked-white.svg | sort -u` prints one line.

### Mockups (`print/mockups/`)

| File | Shows |
| --- | --- |
| `jersey-black-front-and-back.png` | Front chest `stacked-tagline-color-dark` about 55% of the chest's width, left chest `icon-color-dark` where a crest goes, right sleeve below the shoulder `icon-color-dark`, shorts right leg `icon-white`, upper back `stacked-white` about 60% of the back's width |
| `jersey-white-back.png` | The same front, the back's black panel recoloured white (collar rib left black) with `stacked-black` |

Both are 2208 px, for showing placement only, never for printing. They start from
`production-projects/tshirt-design-i-will-print-my-products-logos-on.jpeg`, upscaled 3× (Lanczos), with the sample
brand's marks, player name, numbers, model number and contact line removed, the same cleaned base the earlier kits
use. The chest patch left by removing the sample's chest logo had a hard edge; it sits inside a calm zone of the
cloth's own paint, blurred and darkened to 36%, fading over about 120 px into the untouched paint, which also lets
the white name and line read on the busy front. The crest and sleeve icons get small calm zones of the same kind,
kept to the cloth (the teal backdrop is excluded by colour). Our logos are placed flat, without the cloth's folds,
lightly shaded by the shirt's own light. The paint artwork is the sample's, not ours.
