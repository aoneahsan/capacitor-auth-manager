# Export pipeline

Everything runs as direct commands and heredocs: no script file is created in the project or anywhere else
(`~/.claude/rules/00-house-rules.md`, no scripts). `$S` is the session scratchpad; `$R` the product repo.

## 1. Tools (scratchpad only)

```bash
python3 -m venv "$S/venv" && "$S/venv/bin/pip" install -q fonttools brotli   # brotli reads .woff2; can take ~2 min
```

`sharp-cli` runs through `npx -y sharp-cli@6.1.0`; PIL from the system Python is enough for checks.

## 2. Outline a headline (variable woff2 → SVG path)

```bash
"$S/venv/bin/python" - "$R" <<'EOF'
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
R = sys.argv[1]
f = TTFont(f'{R}/public/fonts/grandstander-latin-wght.woff2'); f.flavor = None
f = instancer.instantiateVariableFont(f, {'wght': 800})          # pin the variable axis
gs, cmap, upm, hmtx = f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm, f['hmtx']
adv = lambda ch: hmtx[cmap[ord(ch)]][0]
width = lambda s, size: sum(adv(c) for c in s) * size / upm

def path(s, x, y, size):                                          # baseline at y
    pen, sc, cx = SVGPathPen(gs), size / upm, x
    for ch in s:
        gs[cmap[ord(ch)]].draw(TransformPen(pen, (sc, 0, 0, -sc, cx, y))); cx += adv(ch) * sc
    return pen.getCommands()

def wrap(s, size, maxw):                                          # balanced: fewest lines, shortest longest line
    words = s.split()
    for n in range(1, len(words) + 1):
        best = None
        def rec(i, k, acc):
            nonlocal best
            if k == 1:
                lines = acc + [' '.join(words[i:])]
                if all(width(l, size) <= maxw for l in lines):
                    m = max(width(l, size) for l in lines)
                    if best is None or m < best[0]: best = (m, lines)
                return
            for j in range(i + 1, len(words) - k + 2): rec(j, k - 1, acc + [' '.join(words[i:j])])
        rec(0, n, [])
        if best: return best[1]

cap, size = "Trade deeds and bucks with anyone at the table.", 84
lines = wrap(cap, size, 960)
lh = size * 1.16; top = 250 - len(lines) * lh / 2 + size * 0.8
print(''.join(f'<path fill="#f9f1f7" d="{path(l, (1080 - width(l, size)) / 2, top + i * lh, size)}"/>'
              for i, l in enumerate(lines)))
EOF
```

Kerning is not applied; at display sizes in a heavy face that has not been visible. Check every line by eye.

## 3. The screenshot master

One SVG per shot, 1080 × 1920, in this order: band `<rect>` → glow `<rect fill="url(#glow)">` → confetti →
headline paths (or the lockup group) → bezel shadow → bezel → `<image href="raw/<screen>.png"
clip-path="url(#screen)" preserveAspectRatio="xMidYMid slice">` → margin tokens (inlined project SVGs). A comment
names the caption key, the font, weight and size, the capture and its date. Geometry: `design-system.md` §4.

## 4. Export (the command the pack README records)

The renderer cannot load a relative `href`, so each capture is inlined first. Run from `app-publish-assets/`:

```bash
for f in screenshots/phone/0*.svg; do python3 -c "import base64,re,sys;f=sys.argv[1];d='screenshots/phone/';s=re.sub(r'href=\"(raw/[a-z]+\.png)\"',lambda m:'href=\"data:image/png;base64,'+base64.b64encode(open(d+m.group(1),'rb').read()).decode()+'\"',open(f).read());open('/tmp/rp-shot.svg','w').write(s)" "$f" && npx -y sharp-cli@6.1.0 --density 72 -i /tmp/rp-shot.svg -o "${f%.svg}.png" resize 1080 1920 -- flatten "#33182d"; done
npx -y sharp-cli@6.1.0 --density 288 -i feature-graphics/feature-1024x500.svg -o feature-graphics/feature-1024x500.png resize 1024 500 -- flatten "#33182d"
npx -y sharp-cli@6.1.0 --density 288 -i icons/play-icon-512.svg -o icons/play-icon-512.png resize 512 512
```

`flatten` with the band colour removes alpha (Play wants 24-bit). A `sed` with the base64 inline fails with
"Argument list too long", which is why the inline step is Python.

## 5. Checks

```bash
file screenshots/phone/0*.png feature-graphics/*.png icons/*.png          # sizes; RGB, not RGBA, except the icon
python3 - <<'EOF'                                                          # contact sheet to look at
from PIL import Image; import glob
fs = sorted(glob.glob('screenshots/phone/0*.png')); W, H = 270, 480
sheet = Image.new('RGB', (W * 4, H * 2), 'white')
for i, f in enumerate(fs): sheet.paste(Image.open(f).convert('RGB').resize((W, H)), ((i % 4) * W, (i // 4) * H))
sheet.save('/tmp/store-sheet.png')
EOF
```

**Pixel-identical round trip:** copy the PNGs aside, run the README's export command exactly as written, and
compare with `PIL.ImageChops.difference(a, b).getbbox() is None` for every file. Any difference means the
documented command is not the one that made the image; fix the record, not the image.
