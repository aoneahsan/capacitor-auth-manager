# The cloned-skills library — what each repo actually is

**Last Updated:** 2026-07-27 · 13 repos · **253 catalogued** + **1,894 quarantined** distinct skills.

Commits are pinned in `sources.json`. Every claim here was read from the repo at that commit, not from its
marketing. Machine paths: `<libraryRoot>/_reviewed/<repo>/`.

> **The single most important number:** 6,618 `SKILL.md` files on disk collapse to **253 distinct skills**
> outside the quarantine. Repos ship the same skill 3–4× (once per agent target and once per plugin bundle).
> Always dedupe by content, never count files.

---

## Tier 1 — official

### `skills` — anthropics/skills · 18 skills · no licence file

The reference implementation of the format; the closest thing to a spec-by-example. `frontend-design` is
the one to know — it is the same skill that ships with Claude Code, so **copying it into a project is
usually pointless**; it is already available. `brand-guidelines`, `canvas-design` and `theme-factory` are
the genuinely additive ones for visual work. `webapp-testing` (Playwright-driven UI verification) pairs
well with a design-review stage. The document skills (`docx`, `pptx`, `xlsx`, `pdf`) ship 12–15 executables
each and ~1.1 MB — only copy when the project really generates documents.

- **Take:** `brand-guidelines`, `theme-factory`, `canvas-design`, `webapp-testing`
- **Ignore:** `frontend-design` (already global), `skill-creator` (house `_templates/skill-template` is the
  authority), the Office skills unless needed
- **Note:** `frontend-design` collides by name with the house skill — the `ext-` prefix handles it

### `flutter-agent-plugins` — flutter/agent-plugins · 36 skills

Google's own. The only Flutter material here worth trusting on version-sensitive detail. Split roughly
`dart-*` (language, testing, FFI, static analysis) and `flutter-*` (widgets, routing, localisation,
architecture). For the UI focus: **`flutter-build-responsive-layout`** and **`flutter-fix-layout-issues`**
are the standouts.

- **Take:** for any Flutter project — responsive layout, layout fixes, declarative routing, widget tests
- **Note:** `code-review` collides with the house skill name
- **Precedence:** house `aoneahsan-cccs-flutter-*` skills carry the *house decisions* (Riverpod, go_router);
  these carry *current Flutter API*. Invoke both, house wins on conflict.

---

## Tier 2 — vendor

### `vercel-labs-agent-skills` — 9 skills · no licence file

`vercel-react-best-practices` and `vercel-composition-patterns` are solid React craft and self-contained.

> ⚠️ **`web-design-guidelines` fetches its rules at runtime** from
> `raw.githubusercontent.com/vercel-labs/web-interface-guidelines`. The file you review is a 40-line stub;
> the actual rules arrive over the network, change without notice, and are unavailable offline. That is
> Snyk's *third-party content exposure* class. `writing-guidelines` does the same. Useful, but never
> describe either as self-contained. `vercel-optimize` ships **90 executables / 807 KB** — the heaviest
> single skill in the library.

- **Take:** `vercel-react-best-practices`, `vercel-composition-patterns`, `vercel-react-view-transitions`
- **Careful:** the two guideline skills (network) · `vercel-optimize` (90 scripts)
- **Ignore:** `deploy-to-vercel`, `vercel-cli-with-tokens` — the fleet deploys to Firebase/Cloudflare

---

## Tier 3 — community, active

### `ui-ux-pro-max-skill` — 7 skills + a searchable database · MIT · **the most valuable asset here**

Not really seven skills — it is one **queryable design database** with a thin skill wrapper: 84 styles,
**192 colour palettes**, 74 font pairings, 192 product types with reasoning rules, 98 UX guidelines, 104
icon entries, 16 GSAP motion presets, 25 chart types, across 22 stacks (React, Next, Vue, Svelte, Astro,
SwiftUI, React Native, Flutter, Tailwind, shadcn, Compose, Laravel, Three.js, …).

Its `SKILL.md` is genuinely good on its own: a priority-ordered rule table that puts **accessibility and
touch targets above visual style**, with explicit anti-patterns per row. It also refuses to guess a stack —
it detects from `package.json`/`pubspec.yaml` or asks.

> 🔴 **The copy trap — two faults in one line.** It invokes its search script as
> `python "${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py"`.
> **(1)** `CLAUDE_PLUGIN_ROOT` is **unset** for a plain `.claude/skills/` skill, so the path collapses and
> every search fails — silently, because the skill then carries on without its data. It appears **11 times**
> in `SKILL.md`. **(2)** It calls `python`, which **does not exist on this machine** — only `python3`. Fix
> both, then run one query to prove it. Verified working 2026-07-27 after the rewrite: a `--design-system`
> query returns pattern, style, a full palette with CSS variable names, a font pairing with its Google Fonts
> URL, effects, and anti-patterns. No external Python deps.

- **Take:** `ui-ux-pro-max` (the flagship) for any UI-heavy project; `design-system` for token architecture
  (three-layer primitive → semantic → component, which matches the house Tailwind v4 approach)
- **Note:** `design-system` collides with the house skill name
- **Ignore:** `slides`, `banner-design` unless that output is actually needed

### `taste-skill` — 13 skills · MIT

The **anti-slop** repo, and the sharpest thinking here about *why* AI UI looks generic. Its core move is a
"design read" — infer page kind, audience and vibe **before** generating — followed by three explicit dials:
`DESIGN_VARIANCE` (symmetry ↔ chaos), `MOTION_INTENSITY` (static ↔ cinematic), `VISUAL_DENSITY` (airy ↔
packed), with inference tables and per-use-case presets.

Its anti-default list is worth internalising verbatim: *no AI-purple gradients, no centred hero over a dark
mesh, no three equal feature cards, no glassmorphism on everything, no Inter + slate-900.*

Honest scope limit, stated by the skill itself: **landing pages, portfolios and redesigns — not dashboards,
not data tables, not multi-step product UI.**

- **Take:** `design-taste-frontend` (the flagship) for landing/marketing/portfolio work; `redesign-existing-projects`
  for an audit-first redesign; `brandkit`; the aesthetic-family skills (`minimalist-ui`,
  `industrial-brutalist-ui`, `high-end-visual-design`) as direction references
- **Ignore:** `design-taste-frontend-v1` (superseded), `gpt-taste`

### `bencium-marketplace` — 15 skills · **no licence file → treat as all-rights-reserved**

Opinionated, essay-shaped, and unusually strong on craft.

**`typography` is the standout in the entire library.** It distils Matthew Butterick's *Practical
Typography* into enforcement rules — curly quotes, correct dashes, hierarchy, measure, spacing — and runs in
**enforcement mode by default**: apply silently to any generated UI, don't ask, don't explain. It is the
single best answer to "why does my AI-generated text look subtly wrong". It correctly attributes Butterick.

`bencium-innovative-ux-designer` pushes bold commitment to one aesthetic extreme (11 named tones) and asks
context questions first. `bencium-controlled-ux-designer` is its restrained sibling. `design-audit` reviews
existing UI.

- **Take:** `typography` — for essentially every project with visible text; the UX-designer pair for
  greenfield visual direction; `design-audit` for a review pass
- **Careful:** no licence — fine for private internal use, do not redistribute
- **Ignore:** `hungarian-humanizer`, `insurgent-campaign`, `renaissance-architecture` (off-topic here)

### `developer-kit` — 128 skills across 12 plugins · MIT · the bulk of the library

Broadest coverage: TypeScript/React/Next, Java/Spring, Python, PHP, AWS, DevOps, project management. Quality
is uneven — good on well-trodden ground, thinner on the edges.

- **Take (frontend):** `tailwind-design-system`, `shadcn-ui`, `react-patterns`, `zod-validation-utilities`
- **Careful:** `better-auth` (11 scripts); the `langchain4j-*` pair needs LLM API keys
- **Ignore:** the Java/PHP/AWS/Spring plugins unless a project actually uses that stack — copying all 128
  would drown the project's skill list

### `accesslint-skills` — 3 skills · no licence file

Narrow and clean: `audit`, `scan`, `diff` for accessibility. Complements the house React-Aria foundation —
React Aria gives correct behaviour, these check the result.

- **Take:** `audit` + `diff` on any project with a real UI

---

## Tier 4 — community, stale

### `claudedesignskills` — 23 skills · MIT · **last commit 2025-11-19 (8 months old)**

The **animation and 3D** depth of the library, and nothing else here covers it: `gsap-scrolltrigger`,
`motion-framer`, `lottie-animations`, `rive-interactive`, `react-spring-physics`, `scroll-reveal-libraries`,
`threejs-webgl`, `react-three-fiber`, plus a `modern-web-design` meta-skill.

Two caveats. **Every skill is duplicated 4×** (`.claude/`, `.factory/`, `plugins/bundles/`,
`plugins/individual/`) — the catalog keeps `.claude/skills/<name>/` as canonical. And at 8 months old,
**its library version claims are stale**: treat the concepts and patterns as good, and verify any specific
version, import path or API against the library's current docs before shipping.

- **Take:** `gsap-scrolltrigger`, `motion-framer`, `lottie-animations`, `scroll-reveal-libraries` for real
  motion work
- **Careful:** most ship 2–3 executables; verify versions independently
- **Ignore:** the heavy 3D engines (`babylonjs`, `playcanvas`, `aframe`, `pixijs`) unless the project is
  genuinely 3D

---

## Tier 5 — excluded and quarantined

### `agent-skills` — sleekdotdesign · 1 skill · MIT · ⛔ **excluded by policy**

`sleek-design-mobile-apps` drives the sleek.design REST API to generate mobile screens. Requires
`SLEEK_API_KEY`; free tier is ~one design run, sustained use is **$49.99/month**. That violates the
zero-cost rule, so it is never proposed. Kept in `_reviewed/` only so it is not re-triaged.

### `agentic-awesome-skills` — sickn33 · **1,894 skills** · MIT · ⚠️ **QUARANTINED**

An aggregator of other people's skills — the same shape as the ClawHub corpus in which Snyk found 13.4 %
carrying a critical issue. It has its own quality-bar and security-guardrails docs, which is a good sign but
not a substitute for reading the one skill you intend to use.

Never proposed, never auto-copied. Indexed by name in `quarantined-index.txt` so a skill can be located; to
use one, the owner names it and it passes `security.md` first. Genuinely useful niches live here (security
testing, `rclone-cli`, domain-specific tooling) — the gate is per-skill, not per-repo.

---

## Tier 6 — link lists, no skills

### `awesome-agent-skills` (VoltAgent) and `awesome-claude-skills` (travisvn)

**Zero `SKILL.md` files.** Curated READMEs pointing at skills elsewhere — discovery sources for *what to
clone next*, not something to copy from. `awesome-claude-skills` was last touched 2026-04-28 and is going
stale. Read them when looking for a capability the library lacks.

---

## Precedence when a cloned skill disagrees with a house skill

The house `aoneahsan-cccs-*` family always wins on **decisions** — stack, zero-cost, storage, push provider,
palette registry, responsive floor. A cloned skill contributes **craft and current API**. Three names
collide directly (`frontend-design`, `design-system`, `code-review`), which is exactly why every copy is
prefixed `ext-<source>-<skill>`.
