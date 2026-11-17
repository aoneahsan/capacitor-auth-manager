# Recipes — which cloned skills a project actually needs

**Last Updated:** 2026-07-30 (the copy step now also fires at IMPLEMENTATION start, not design only; the
backend row records that no vetted cloned source exists — its candidates are all in the quarantined aggregate)

Start here. These cover the common cases without opening `CATALOG.json` (147 KB — query it with `jq`, never
read it whole).

**Codex rule (owner, 2026-11-11):** copy every related vetted external skill before its phase begins, without a separate approval. The counts below guide relevance and context cost; they never excuse omitting a matching skill. The owner-created skills named in each recipe are copied through `aoneahsan-cccs-catalog/references/project-copy.md` as well.

## Two rules that shape every recipe

**Keep the set small.** Every copied skill is context the project pays for on every session, and a folder
someone must later maintain. **3–6 skills is a good project. More than 8 needs a reason.** Copying "all the
design ones" is the failure mode, not thoroughness.

**Never copy what the house family already covers.** The `aoneahsan-cccs-*` skills are installed globally and
carry the *decisions*. Cloned skills are only worth copying when they add **craft depth or a current
third-party API** the house does not have. Concretely — do **not** copy:

| Don't copy | Because the house already owns it |
|---|---|
| `skills/frontend-design` | ships with Claude Code already, and `aoneahsan-cccs-frontend-design` carries the house direction |
| any generic "responsive" skill | `aoneahsan-cccs-frontend-development` (320→1920 floor) |
| any generic a11y primer | `aoneahsan-cccs-react-accessibility` + the installed `react-aria` skill |
| any state/query/table/form skill | `-react-state-zustand`, `-react-api-tanstack-query`, `-react-tables-tanstack`, `-react-forms` |
| `deploy-to-vercel`, `vercel-cli-with-tokens` | fleet deploys to Firebase / Cloudflare |
| `skill-creator` (any source) | `custom-skills/_templates/skill-template` |

---

## The core UI/UX set — 🔴 MANDATORY before any design work starts

**Copy these four before the first line of markup on any project where visual quality matters** — a click
dummy, a rebuild's Phase A, a landing page, a redesign. Not a proposal to weigh: the design phase does not
begin until they are in `.claude/skills/`.

Four is well inside the 3–6 discipline above, so this obligation and that budget do not fight. What it
replaces is the failure mode where an agent invokes the two house skills that sound most relevant, skips the
external craft, and produces a page that clears every gate and reads as templated.

| Copy as | From | Why this one |
|---|---|---|
| `ext-uiuxpm-ui-ux-pro-max` | ui-ux-pro-max-skill | 192 palettes · 84 styles · 74 font pairings · 98 UX guidelines · 16 GSAP presets, queryable per stack. **Fix the `CLAUDE_PLUGIN_ROOT` path and prove one query runs.** |
| `ext-bencium-ui-typography` | bencium-marketplace | Butterick's rules in enforcement mode — the fastest single upgrade to "looks professionally set" |
| `ext-accesslint-audit` | accesslint-skills | Checks the built result; React Aria only guarantees behaviour |
| `ext-anthropic-theme-factory` | skills | Coherent palette/theme generation, pairs with the house palette registry |

Add **one** motion skill only when the project actually animates:
`ext-cds-motion-framer` (React/Framer Motion) · `ext-cds-gsap-scrolltrigger` (scroll-driven) ·
`ext-cds-lottie-animations` (designer-authored assets). Verify version claims independently — that repo is
8 months stale.

---

## By project type

### 🔴 Click dummy · a rebuild's Phase A

The mandatory core set **plus `ext-taste-design-taste-frontend`** — a dummy's home page *is* a landing page,
and that skill carries the brief-inference and the variance / motion / density dials that decide whether it
reads as designed. Add one motion skill when the dummy animates, which it does whenever it has a marketing
surface (`~/.claude/rules/frontend-ui-standards.md` §1a).

Six total. Copy them **before A0**, not when a page comes back rejected. The house side of the loadout is
`aoneahsan-cccs-click-dummy` → its craft-loadout reference.

### 🔴 Implementation start — a Phase B wave 0, or any frontend/backend build

**The copy step is not design-only.** Implementation has its own craft set, and the same failure applies: an
agent that starts a build with only the house skills loaded produces code that passes every gate and misses
the current API. So at the **start of an implementation phase**, copy that phase's set before the first module —
proposed, not mandated, unless the phase includes design work (then the core UI/UX set above is mandatory too).

| Phase | Copy |
|---|---|
| React frontend build | `ext-vercel-vercel-react-best-practices` + **`ext-vercel-vercel-composition-patterns`** when the component layer is being built |
| Forms, validation, any API boundary | **`ext-devkit-zod-validation-utilities`** — the house skill carries the RHF+Zod *decision*; this carries the Zod **v4** API |
| A per-module review gate | **`ext-devkit-react-code-review`** — pairs with `aoneahsan-cccs-code-review`, which owns the process |
| A phase that also designs | the core UI/UX set above, **mandatory** |
| Backend / API build | 🔴 **nothing vetted exists yet.** The plausible candidates (`backend-dev-guidelines`, `api-design-principles`, `database-design`) all live in `agentic-awesome-skills`, which is **quarantined** — the owner must name a skill and it must be vetted per `security.md` before any copy. Do not propose them as a routine set. |

The house skills win on every **decision** regardless — `aoneahsan-cccs-data-contract` owns where processing
happens and how a request is validated, and no cloned skill overrides it. For a backend phase that is currently
the whole loadout, and it is sufficient.

### React web app (UI-heavy)

Core UI/UX set above, plus `ext-vercel-vercel-react-best-practices` and, when the component layer is being
built, `ext-vercel-vercel-composition-patterns`.

> 🔴 **`ext-devkit-tailwind-design-system` is NOT the component-layer skill, and was recommended here until
> 2026-07-31.** It is explicitly *"a Design System using Tailwind CSS and **shadcn/ui**… wrapping shadcn/ui
> components into design system primitives"* — i.e. it recommends installing a component library, which the
> house React Aria + custom-components standard replaced (`aoneahsan-cccs-react-aria`, `-design-system`). A
> recipe that sends an agent to install shadcn is worse than no recipe, because it arrives with vendor
> authority. `ext-devkit-tailwind-css-patterns` and `ext-uiuxpm-ui-styling` are shadcn-flavoured or redundant
> with `aoneahsan-cccs-tailwind-v4` for the same reason. Found during habitforge's Phase B wave 0.

### Landing page · marketing site · portfolio

Core set, plus **`ext-taste-design-taste-frontend`** — the anti-slop brief-inference and the three dials
(variance / motion / density). This is where it belongs and it says so itself: **not for dashboards, data
tables, or multi-step product UI.** Add `ext-taste-brandkit` when the brand is being created from scratch.

### Redesigning an existing UI

`ext-taste-redesign-existing-projects` (audit-first: read the existing brand before overhauling) +
`ext-bencium-design-audit` + `ext-accesslint-diff` (regression check between states) + the core set.

### React + Capacitor mobile app

Core set, plus `ext-uiuxpm-ui-ux-pro-max` earns its place twice over here — its priority table puts touch
targets (44×44) and safe areas above visual style. The house `aoneahsan-cccs-capacitor` skill still owns
every native decision.

### Flutter app

`ext-flutter-flutter-build-responsive-layout` + `ext-flutter-flutter-fix-layout-issues`, plus
`ext-bencium-ui-typography` (typography is stack-independent) and `ext-uiuxpm-ui-ux-pro-max` (it covers the
Flutter stack). The `aoneahsan-cccs-flutter-*` family still wins on Riverpod / go_router / architecture.

### Browser extension

`ext-bencium-ui-typography` and, if the options page is substantial, the core set. Everything structural is
owned by `aoneahsan-cccs-browser-extension*`. **Extensions cannot load remote code** — never copy a skill
that fetches at runtime (`web-design-guidelines`, `writing-guidelines`).

### Laravel / backend-only

Usually **nothing**. `ext-devkit-*` backend skills only if the project uses that exact stack. If a project
has no UI, the honest answer is that it needs no cloned skills.

### Docs site (Docusaurus)

Usually **nothing** — `aoneahsan-cccs-docusaurus` covers it. `ext-bencium-ui-typography` if the site has
heavy prose.

---

## Querying the catalog when no recipe fits

```bash
C=~/.claude/skills/aoneahsan-cccs-cloned-skills-library/references/CATALOG.json

# everything in a category, trusted sources only
jq -r '.skills[] | select(.category=="motion-3d" and .trustTier!="quarantined")
       | "\(.copyAs)  <- \(.id)"' "$C"

# free-text search across name + description
jq -r --arg q "colour palette" '.skills[]
       | select((.name+" "+.description) | ascii_downcase | contains($q|ascii_downcase))
       | "\(.copyAs)  [\(.trustTier)]  \(.description[0:90])"' "$C"

# only skills that survive a plain folder copy with no fixups
jq -r '.skills[] | select(has("selfContained")|not) | .copyAs' "$C"

# what needs work before it will run
jq -r '.skills[] | select(.copyNotes) | "\(.copyAs): \(.copyNotes|join("; "))"' "$C"
```

Quarantined skills are **not** in `CATALOG.json` — they are names-only in `quarantined-index.txt`, and
reaching one requires the owner to name it plus a pass through `security.md`.
