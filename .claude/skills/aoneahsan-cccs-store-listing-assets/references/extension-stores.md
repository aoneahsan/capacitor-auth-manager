# The extension-store set

For a browser-extension project. Android stays held (`~/.claude/rules/project-completion.md`), so no Play asset is
started. The design system is the same (`design-system.md`): the project's own band, glow, lockup, fonts and art.
Only the canvases and the frame change.

## Canvases

Confirm each size in the store's own upload form on the day; the stores change them. The Chrome rejection ledger
is `~/.claude/policy/chrome-web-store-rejection-rules.json`.

| Asset | Chrome Web Store | Edge Add-ons | Firefox Add-ons |
|---|---|---|---|
| Store icon | 128 × 128 (the manifest icon) | 300 × 300 logo | the manifest icon |
| Small promo tile | 440 × 280 | 440 × 280 | — |
| Marquee / large promo | 1400 × 560 | 1400 × 560 | — |
| Screenshots | 1280 × 800, up to 5 | 1280 × 800, up to 6 | the same 1280 × 800 set |

Make one master per canvas and reuse it across stores; the 1280 × 800 screenshots serve all three.

## Promo tiles

They're laid out like the feature graphic: the lockup big on the band, and on the marquee a scene of the product's own art.
The 440 × 280 tile holds the mark and the name only (the line becomes unreadable at that size). No claim, price
or call to action.

## Screenshots (1280 × 800)

- Shot 1: the lockup on the left, a real capture on the right in a **browser-window frame** (a rounded window
  with three dots and a plain address bar showing the page the extension works on, drawn in the band's tones).
- Shots 2–5: an approved caption as a balanced headline on the left (about 40% of the width), the framed capture
  on the right. The capture shows the extension at work: the popup, the options page, or the in-page UI on a
  real public page.
- Captures come from the automation browser with the extension loaded unpacked
  (`~/.claude/rules/browser-automation.md`). Never show a signed-in account other than a test account, and never
  a page with private data.

## Words

The same approved-surface rule: the extension's store copy and captions go through the story system first.
Every banned word in the Chrome ledger is out of every image.
