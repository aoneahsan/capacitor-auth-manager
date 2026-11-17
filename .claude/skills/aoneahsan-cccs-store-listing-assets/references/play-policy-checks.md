# Play policy checks for listing graphics

The rejection ledger is `~/.claude/policy/play-console-rejection-rules.json` (`prohibitedWords`,
`quickChecklist.metadataCheck`). Read it each time; this file only says how to apply it to images.

## Sizes and counts

| Asset | Play limit | Ours |
|---|---|---|
| App icon | 512 × 512, 32-bit PNG, ≤ 1 MB | 512 × 512 |
| Feature graphic | 1024 × 500, JPEG or 24-bit PNG, no alpha | 1024 × 500, 24-bit PNG |
| Phone screenshots | 2–8, PNG/JPEG, 16:9 or 9:16, each side 320–3,840 px | 8 × 1080 × 1920 |

## Words inside images

- Only the approved store surface: `store.graphic.line` and `store.shot.*`. Scan every headline against
  `prohibitedWords`, whole word, any case (one hit, "new", was cut from a caption on Rent Party).
- No ranking, price, "free", discount, download or user counts, testimonials or calls to action.
- No other company's name, trademark, art or board elements (Rent Party: D-001; "Monopoly" stays out of the title,
  description, tags and every image even though people search for it).

## The screens

- Each screen is the current app ("Screenshots match current app version EXACTLY" in the ledger). A stale string
  is a mismatch: Rent Party's Play screen said "2 to 6 people" while the app and description said 2 to 8.
- A framed, captioned capture is allowed; a mocked screen, a feature the store app lacks, or a price on a
  screen that sells nothing is not.
- The brand first shot still frames a real capture, so it counts as showing the app.

## The feature graphic

Mark + name + one factual line, big (`~/.claude/rules/publishing-compliance.md`). A scene of the product's own art
is allowed; no claim, price or call to action.

## Reference implementation

Rent Party (2026-10-27), private repo `aoneahsan/monopoly`:
`app-publish-assets/feature-graphics/feature-1024x500.svg`, `app-publish-assets/screenshots/phone/0*.svg` with
`raw/`, and the records `docs/play-store/STORE-LISTING.md` (Screenshots) and `docs/play-store/README.md` (Assets).
Open them to compare proportions before designing a new set; never copy its palette or art into another project.
