---
name: aoneahsan-cccs-store-listing-assets
description: 'Play Store listing graphics and the whole listing package, custom-designed from the project''s own UI system: the 512 app icon, the 1024x500 feature graphic and eight 1080x1920 phone shots that each explain one real feature (a brand first shot the owner approves first, then seven feature shots), each an SVG master with an upload PNG. Use when the owner says "play store listing content", when redeveloping, finalizing or completing a project (/finalize-project, /complete-project), preparing an Android or Play Console submission, when assets are missing, stale or improvable, or when asked for store listing assets, a feature graphic or store screenshots.'
---

# Store listing assets

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

## Overview

The store page is the first screen most users see, so it is designed from the **project's own** palette, type,
mark and art, never a template. Every image is the brand lockup or a **real, current capture**, framed, under
already-approved words.

**The standard:** icon + feature graphic + eight phone shots, one visual system, every PNG reproducible from its SVG
master with a documented command. 🔴 Since 2026-11-09 every shot **explains one real feature**, fully custom-designed,
never AI-looking, and shot 1 goes to the owner before shots 2–8 are made (law and his words:
`~/.claude/rules-detail/store-listing-assets.md` → "The 2026-11-09 law").

## When to use

- 🔴 The owner says **"play store listing content"**: the WHOLE package is finished — listing copy, declarations,
  Data Safety, release notes (with `-android-finalization`, `-copywriting`, the story system) and every graphic here.
  Made if missing, redone if stale, improved if weak. Never reported done with one part open.
- 🔴 **Every** project redevelopment (its release wave) and **every** `/finalize-project` and `/complete-project` run:
  a required step, made fresh or brought up to this standard each time.
- A project is prepared for Android / Play Console submission.
- The owner asks for store listing assets, or a listing's images are generic, stale or contradict the app.

- 🔴 **Portfolio project listings** (owner, 2026-10-28): `references/design-system.md` → "Portfolio project listings".

**Not for:** listing words (the story system and `aoneahsan-cccs-copywriting`), the Console forms
(`aoneahsan-cccs-android-finalization`), web Open Graph images (`aoneahsan-cccs-postbuild-seo-html`).

## Before acting

Use `aoneahsan-cccs-project-understanding`. Read the project's `tokens.css` (or theme file), its fonts, its brand
mark, its illustration folders, `docs/play-store/STORE-LISTING.md` and the approved store surface in
`docs/story/`. No approved `store.graphic.line` / `store.shot.*` words → run the story workflow first; never invent
a caption. Never ask the owner to choose a direction: decide, write the reasoning down, then show him the finished
shot 1 for approval before making shots 2–8.

## Which set

| Project category (`aoneahsan-cccs-project-completion`) | Set |
|---|---|
| Web app (Android follows) · mobile app | The Play set below |
| Browser extension (Android held) | The extension-store set: `references/extension-stores.md`. Never start Play assets |
| Package | NA, recorded in the audit with the reason |

## The deliverables

| Asset | Size, format | Content |
|---|---|---|
| App icon | 512 × 512 PNG, alpha allowed | The launcher mark as Android shows it |
| Feature graphic | 1024 × 500 PNG, 24-bit, no alpha | Mark + name + one approved line, big, on the brand's strongest band, plus a scene of the product's own art |
| Shot 1 (brand) | 1080 × 1920 PNG, 24-bit, no alpha | The lockup and approved line above the core feature in a phone frame. **Shown to the owner first** |
| Shots 2–8 | same | One feature each: approved caption as a balanced headline, at most one approved feature sentence, the feature's own screen in the same frame |

All live in `app-publish-assets/` (`icons/`, `feature-graphics/`, `screenshots/phone/`). Each image has its SVG
master beside the PNG; screenshot masters reference their capture in `screenshots/phone/raw/`.

## 🔴 The hard lines

- 🔴 **The project's own system only**: palette from its tokens, fonts from its own font files (outlined to paths),
  its mark, its own illustrations. A generic gradient, stock art or a borrowed palette fails.
- 🔴 **Words only from the approved store surface.** No new copy, no "best / #1 / free / new", no counts, no price.
- 🔴 **No other company's trademark** in any image, title, description or tag — however people search. A
  comparison belongs only where the project's decisions allow it (campaign copy), never the store.
- 🔴 **Each shot explains one real feature** every user reaches (no admin or plan-only feature). The screen is built
  from the project's own tokens, fonts, icon paths and UI strings (its source or approved click dummy) with fixture
  data, or is a real current capture when one shows the feature better: `references/design-system.md` →
  Feature-explainer shots. Never a feature the app lacks, never a contradiction of the app.
- 🔴 **Headlines reuse approved or shipped words; strike any screen showing another company's name, a plan-only
  feature or a banned word.** Method: `references/design-system.md` → "Feature-explainer shots: the worked method".
- 🔴 **A capture, when used, is real**: the current app, a non-admin test account, no email address or real name;
  never edit a capture's contents. Native app with no browser shell and no device: `references/capture.md`.
- 🔴 **Recapture before framing** when the app has changed since the capture or the capture contradicts the
  listing (a player count, a removed button). Eight shots = eight different screens; no capture twice.
- 🔴 **Decoration stays in the margins**, never over the screen; headlines are balanced (no orphan word) and
  nothing leaves the canvas.
- 🔴 **No script files.** Generation runs as `python3 - <<'EOF'` heredocs and one-line commands; any tool install
  (fontTools) lives in a session-scratchpad venv, never the project.
- 🔴 Store and policy limits come from `~/.claude/policy/play-console-rejection-rules.json` — read it, never copy it.

## Done means

0. The owner approved shot 1 before shots 2–8 were made, and their captions passed Story Gate 4.
1. A contact sheet of all eight shots and one full-size shot were looked at, plus the feature graphic and icon; the
   custom-made swap, read-aloud and looking tests pass on each.
2. The export command written in `docs/play-store/README.md` regenerates every PNG **pixel-identical** (checked).
3. `file` reports the right size and colour type for each PNG.
4. `docs/play-store/STORE-LISTING.md` lists every shot in upload order with its capture, key and headline.
5. Committed and pushed with the project's other records.

## Common mistakes

Six paid-for mistakes (light page colour, squeezed lockup, greedy wrap, stale capture, a reused capture, a
relative `<image href>`): `references/design-system.md` → "Common mistakes" — read it before the first export.

## Going deeper

- `references/design-system.md` — reading a project's tokens, fonts, mark and art; the lockup, band and glow; the
  phone-frame geometry; token placement in the margins; the feature-graphic scene.
- `references/capture.md` — real captures with the automation browser: profile check, the native-shell switch,
  viewport math and the screenshot cap, the freshness check, privacy.
- `references/export-pipeline.md` — the exact heredocs: outlining variable fonts with fontTools, balanced wrap,
  building the SVG, inlining captures, `sharp-cli` export, the pixel-identical check and the contact sheet.
- `references/play-policy-checks.md` — sizes, counts, metadata and trademark checks, and the reference
  implementation (Rent Party) to compare against.
- `references/extension-stores.md` — the Chrome, Edge and Firefox set: icon, promo tiles, 1280 × 800 framed
  screenshots in a browser-window frame, and where each size is confirmed.

## Related skills

`aoneahsan-cccs-frontend-design` · `-design-process` · `-android-finalization` · `-story-craft` ·
`-browser-extension-finalization` · `-project-completion` · `-project-rebuild`.

<!-- Law: ../../rules/store-listing-assets.md · ../../rules-detail/store-listing-assets.md -->
