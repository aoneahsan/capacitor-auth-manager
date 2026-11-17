---
name: aoneahsan-cccs-copywriting
description: 'Use whenever writing prose a human will read — docs, README, commit and PR messages, error messages, UI copy and microcopy, empty and loading states, onboarding, reports — and especially store listings, marketing and changelog copy. Covers clear-and-concise writing and the honesty and banned-words rules.'
metadata:
  source: elements-of-style:writing-clearly-and-concisely (Strunk, public domain) + the owner's honest-framing and banned-words rules (rules/publishing-compliance.md, seo-aeo-ranking.md)
---

# Copywriting

🔴 **Floor:** `aoneahsan-cccs-custom-made`. What this produces must look and read as made by hand for this one product, never AI-generated (owner, 2026-11-04).

## Overview

Write so a human reads it once and acts. Two layers: the timeless clarity rules (omit needless words, active
voice, concrete language, emphatic word last) and the owner's product-voice rules (100% honest, no hype, and
— on any store listing — zero banned words). Store copy is short and factual; the app and website are where
depth belongs.

**The standard:** every sentence earns its place; every claim is true; store-facing copy contains no banned
word and no fabricated statistic.

## When to use

- Docs, README, code comments, commit/PR messages, reports.
- UI copy: buttons, labels, errors, empty/loading states, onboarding, microcopy.
- Store listings, marketing pages, changelog/release-notes, social copy.
- Email copy — subject, heading, intro, button label, footer. The layout around the words is fixed by
  `aoneahsan-cccs-email-campaigns/references/transactional-email-layout.md`.

## The clarity rules (Strunk, distilled)

- **Omit needless words.** "the reason is that" → "because"; "in order to" → "to"; "there is a X that" → "X".
- **Active voice.** "the request is handled by the worker" → "the worker handles the request".
- **Positive form.** Say what is, not what isn't: "did not remember" → "forgot".
- **Definite, specific, concrete.** "improves performance" → "cuts first paint from 3.1s to 0.8s".
- **Keep related words together;** put the **emphatic word last** — the sentence's point lands at its end.
- **One topic per paragraph, topic sentence first.** Parallel ideas in parallel form.

Full rule set with before/after examples: `references/prose-rules.md`.

## The product-voice rules (owner)

- **100% honest framing.** Say what a tool DOESN'T do as plainly as what it does. A browser-only privacy
  claim must match reality — never "your data never leaves your device" if any backend call is made.
- **No fabricated statistics.** Cite a real source by name when you use a number (never invent one).
- **Store copy is brief + factual** (title ≤30 chars, short desc ≤80, full desc factual prose, no keyword
  lists or code blocks). Rich detail goes in the app/website, not the listing.
- 🔴 **Full / long store description ≤ 1,500 characters (owner, 2026-09-29) — Play, App Store, Chrome / Edge /
  Firefox, every store.** Only the core features every user reaches from the main screens; never an admin,
  staff, moderator, plan-only or hidden feature, never narrative filler. A long description gets an app into
  review trouble; depth belongs on the website. Count it with `wc -m` and state the count beside the copy.
- 🔴 **Feature graphic = brand mark + product name + ONE short factual line, big and readable** (owner,
  2026-09-29) — never a bare logo, never promotional (no ranking, price, "free", call to action or count).
  Outline the text to paths from the product's own fonts so the export depends on no installed font.
- **Banned words in ANY store listing:** best, #1, top, leading, free, cutting-edge, "trusted by thousands",
  user counts, testimonials, unverifiable legal/security claims (HIPAA/GDPR/"end-to-end encrypted" if
  untrue), "AI-powered" when it's rule-based, emojis in the title. Cross-check
  `~/.claude/policy/play-console-rejection-rules.json` + `chrome-web-store-rejection-rules.json`.
- **No keyword stuffing** — it harms clarity and can violate search spam policies.
- 🔴 **Never discourage someone who is about to pay (owner, 2026-10-06, his most critical rule).** No
  *"we do not give refunds"*, no warning banner, no *"before you pay"* framing on a pricing section, plans
  page, plan card, checkout, upgrade prompt, blog, FAQ or listing. 🔴 **The policy is NO REFUNDS on every
  project, never asked** (owner, 2026-10-10; an exception exists only as his typed, reasoned request recorded in
  that project's `CLAUDE.md` + `AGENTS.md`). It is explained in the Privacy Policy and the Terms of Service; a
  pay surface carries only *"By continuing, you agree to our Terms of Service and Privacy Policy."* Law:
  `~/.claude/rules/payment-copy.md`.

## Common mistakes

| Mistake | Instead |
|---|---|
| "In order to be able to handle…" | "To handle…" |
| "This is the best, #1 free tool" (store copy) | "A [category] tool that [does X]." — factual, no banned words |
| "Your data never leaves your device" (with a backend call) | State the real data flow honestly |
| A number with no source | Name the source, or cut the number |
| Depth crammed into a store listing | Short + factual on the store; depth in the app/site |
| A 3,000-character full description listing every screen | ≤ 1,500 chars: the everyday features, nothing admin- or plan-only |

## Going deeper

- `references/prose-rules.md` — the Strunk composition rules with before/after examples.

## Related skills

`aoneahsan-cccs-markdown` (this skill owns the words; that one owns the formatting they sit in — headings,
tables, anchors, fences) · `aoneahsan-cccs-npm-package-readme` (which section a given piece of copy belongs
in) · `aoneahsan-cccs-documentation` (brevity budget for docs) · `aoneahsan-cccs-react-ui-ux` /
`aoneahsan-cccs-react-seo` / `aoneahsan-cccs-react-aeo` (where UI + search copy live).

<!-- Living registries (link, never copy): ~/.claude/rules/publishing-compliance.md, seo-aeo-ranking.md, policy/*.json when present. -->
