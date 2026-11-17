---
name: aoneahsan-cccs-i18n
description: 'Internationalisation structure: the mechanism ships complete while English stays the only locale, permanent key namespacing, interpolation and plurals, locale-aware dates and numbers, measurement units as a user preference rather than a locale, an RTL path kept correct for later, and the lint gate that makes "no hardcoded string" enforceable instead of merely stated. Use when adding ANY user-visible text, building screens, formatting a date, number or measurement, scaffolding i18n, or preparing for a second locale.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/prompt-logs.md
---

# i18n

**English is the only locale that ships, and every string still goes through the i18n layer.** The layer is
cheap now and impossible to retrofit — adding it later touches every component in the app.

## 🔴 The owner settled this, and asked never to be asked again (2026-08-18)

> *"build the foundation fully, but we do not need to spend time on transalations strings, text yet, have it
> fully integrated, but for now engliush only is fine, but make sure later is just a matter of adding
> translation text and nothing else, add it as rule, in custom skills as well so i will not have to explain
> again"*

Two instructions, both binding: **no translated content, ever, until he asks** — and **the mechanism
complete**. The acceptance test is one sentence: **is adding a second language ONE new catalogue file, and
nothing else?** If it needs a component edited, a string extracted, a plural form invented or `<html lang>`
wired, the foundation is not built.

## 🔴 Advice was measured to fail. Ship the gate

The paragraph above this one has been in this skill since it was written, and habitforge still shipped
**three complete waves** — W0, W1, W2 — with `t()` called from **zero** files, while a correct, typed
`i18n.ts` sat in the tree. Nothing caught it: a hardcoded string passes typecheck, lint, build, and any
review reading for correctness rather than for absence.

**So every project carries a lint gate, built from `no-restricted-syntax` AST selectors — never a new
dependency for one rule:** a `JSXText[value=/[A-Za-z]{3,}/]` selector for text between tags, plus a
`JSXAttribute[name.name=/^(label|placeholder|title|description|errorMessage|aria-label)$/] > Literal`
selector for copy carried as a prop, which `JSXText` never sees.

🔴 **And a non-JSX family, because every selector above starts from a JSX node.** Copy that travels through an
object, an argument or a return — a zod message, `setError('…')`, `` announce(`${name} was removed.`) ``, a menu's
`{ label }` — is invisible to all of them: trizlink found **217 such strings in 52 files** behind a clean lint
(2026-09-14). The selector set, its scoping (app source only — repo-wide it fires on the catalogue itself) and the
registries that must carry keys instead of `t()` (anything the build config or a Worker imports) are in
`~/.claude/rules-detail/i18n.md` → *"Both selectors above start from a JSX node"*.

🔴 **Land it as `warn`, sweep the tree, then flip to `error`** — a gate switched on over a dirty tree is one
the next session disables. 🔴 **Watch it fail against a planted literal before trusting it.**
🔴 **Retrofitting is ONE sweep across the whole tree or nothing** — half-keyed is worse than either end.

**Full law, exact config, sweep order:** `~/.claude/rules/i18n.md` → `~/.claude/rules-detail/i18n.md`.

## Namespacing is permanent

Choose the scheme once. Renaming a namespace later means touching every call site that uses it.

```
common.json      actions, labels, states shared everywhere — save, cancel, loading
validation.json  error messages (mirrored by the Zod schemas)
health.json      one namespace per feature domain
people.json
settings.json
```

```tsx
const {t} = useTranslation('health');
t('water.logged', {volume: 250});
```

**Key names describe meaning, not the English text.** `water.logged` survives a copy change;
`water.youLogged250ml` does not.

## Interpolation and plurals

```json
{
  "water": {
    "logged": "Logged {{volume}} ml",
    "entry_one": "{{count}} entry",
    "entry_other": "{{count}} entries"
  }
}
```

**Never concatenate translated fragments.** `t('you.have') + count + t('entries')` produces text no other
language can express — word order is not universal. One key, one whole sentence, with interpolation.

## 🔴 Units are a user preference, not a locale

This is the distinction most i18n setups get wrong, and in a health app it matters more than usual.

| Concern | Driven by |
|---|---|
| Language of the text | **locale** |
| Date and number *formatting* | **locale** (`Intl.DateTimeFormat`, `Intl.NumberFormat`) |
| **Metric vs imperial** — kg/lb, ml/oz, cm/ft | **the user's own setting**, stored on the profile |

A user in the US may want kilograms; a user in the UK may want stones. Tying units to locale takes that
choice away and produces confidently wrong numbers. Store the preference, convert at the display boundary,
and **always store the canonical unit in the database** — convert on the way in and out, never in storage.

## Dates, numbers, RTL and lazy namespaces

`Intl` for display, never a hand-written format; logical CSS properties and `dir` on `<html>` keep RTL
correct; `common` loads at boot and each feature namespace with its route. Read
`references/dates-rtl-and-loading.md` when formatting a date or number, writing layout CSS, or splitting
catalogues.

## Common mistakes

| Mistake | What happens | Instead |
|---|---|---|
| Hardcoded string "just for now" | the retrofit touches every component | always through `t()` |
| Keys named after English text | every copy edit breaks keys | name by meaning |
| Concatenated fragments | untranslatable word order | one key, whole sentence |
| Units tied to locale | confidently wrong numbers | a stored user preference |
| Converted units in the database | the stored value's meaning depends on a setting | store canonical, convert at display |
| `margin-left` everywhere | RTL becomes a rewrite | logical properties |

## Related skills

`aoneahsan-cccs-copywriting` (the strings themselves) · `-react-forms` (validation messages live in the Zod
schema and mirror `validation.json`) · `-unit-testing` (unit conversions and date boundaries earn tests) ·
`-frontend-development` (logical properties in layout).
