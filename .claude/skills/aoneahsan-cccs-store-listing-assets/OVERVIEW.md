# Store listing assets — overview

## Purpose

Makes a project's Play Store graphics (icon, feature graphic, eight phone screenshots) look like the product itself:
its own palette, type, mark and illustrations, framing real captures of the current app under words the story system
already approved. It exists because the owner judged the Rent Party set made this way (2026-10-27) the standard for
every project, after a plain logo-on-pale-pink feature graphic and unframed captures.

## What this skill does

- Derives the visual system from the project: tokens, fonts, mark, illustration assets.
- Designs the feature graphic: the lockup big on the brand's strongest band, with a scene of the product's own art.
- Designs a brand first screenshot and seven framed screenshots with balanced headlines.
- Captures fresh, real screens with the automation browser and checks them against the app and the listing.
- Exports every PNG from an SVG master with a documented, reproducible command, and proves it pixel-identical.
- Keeps the listing records (`STORE-LISTING.md`, the pack README) in step.

## When it gets invoked

- "make great play console store listing assets"
- "the featured image is not great, improve it" / "optimize the screenshots"
- "finalize android play store submission" (the assets step)
- Every project redevelopment (release wave) and every `/finalize-project` run, as a required step
- Any Play listing whose images are generic, stale or contradict the app

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Every web or mobile app (Play set) and every browser extension (extension-store set); NA for a package |
| Stack override | Any stack: tokens may live in CSS, a Flutter theme or a design file, so read them where the project keeps them |

## Sources

| Source | Record |
|---|---|
| Owner directive 2026-10-27 | `~/.claude/rules-detail/store-listing-assets.md` |
| Reference implementation | Rent Party, `monopoly/app-publish-assets/` and `docs/play-store/` |

## Related skills

- `aoneahsan-cccs-android-finalization` — the Console pass that consumes these assets
- `aoneahsan-cccs-frontend-design` · `-design-process` — the design craft
- `aoneahsan-cccs-story-craft` — where the approved words come from

## Maintenance

- **Living registries this skill points at:** `~/.claude/policy/play-console-rejection-rules.json`,
  `~/.claude/rules/store-listing-assets.md`, `~/.claude/rules/publishing-compliance.md`
- **Last reviewed:** 2026-10-27
