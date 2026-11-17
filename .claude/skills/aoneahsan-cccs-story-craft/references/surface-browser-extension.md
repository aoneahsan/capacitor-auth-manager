# Surface — browser extension

The reader meets an extension in three places: the store listing, the popup (a few square centimetres, a
few seconds), and the install/update pages. Each has a fixed shape in this fleet; the voice fits inside it.

## Store listing (Chrome Web Store, Edge Add-ons, Firefox AMO)

Same rules as the mobile listing: short, factual, zero banned words
(`~/.claude/policy/chrome-web-store-rejection-rules.json`). Plus the extension-specific honesty lines: no
claim of a capability that needs remote code (banned outright — `~/.claude/rules/browser-extensions.md`),
and every permission justified in plain language the reviewer can verify against the manifest
(`aoneahsan-cccs-browser-extension-finalization`).

## The popup

One line that states what the extension does on *this* page, then at most three actions as verb + object.
No onboarding in the popup. A disabled state says why in ≤ 8 words. The emotional palette shows up in the
empty state ("Nothing to block here. Enjoy the page.") if the Bible allows humor, and nowhere else.

## Options page

Section headings are the user's questions ("When should it run?"), not the setting's internal name. Each
setting: label · one sentence of consequence · the control. A "Discover" tab carries the ecosystem roster
(`~/.claude/rules/post-install-onboarding.md`) — an introduction, never a sales page.

## Install and update pages (in-extension, never the website)

Install: `welcome → account → settings → discover → thankyou`. Update: `whatsnew → [account] →
newsettings → discover → feedback`. Each step is one screen, one idea, one action, skippable. `whatsnew` is a
changelog told as change-for-you ("You can now …"), three items at most, no version-number theatre. Feedback
asks one question and offers one channel.

## Changelog voice

Present tense, one line per change, user-facing effect first, technical cause second if at all. The
`RELEASE-NOTES.md` file is the only home; the store's release notes copy from it
(`~/.claude/rules/publishing-compliance.md`).

## Traps

- Any string mentioning analytics or a remote service the extension does not actually load — extensions
  ship no GA4/Clarity/CDN scripts; Sentry bundled is the whole telemetry story.
- A permission the copy justifies that the manifest no longer requests, or the reverse.
- Humor in the "extension disabled by policy" state — that is an error of consequence for the user.

Related: `aoneahsan-cccs-browser-extension-ui-ux` (every surface's contract) ·
`aoneahsan-cccs-browser-extension-finalization` (the version cascade and store copy).
