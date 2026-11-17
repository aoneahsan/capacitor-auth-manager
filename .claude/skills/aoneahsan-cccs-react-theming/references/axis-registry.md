# The axis registry and the four gates

Derived from LabFlow's click dummy, 2026-08-01, where all of it was built and measured. The code is plain
ES5-in-a-file because a dummy has no build step; in an app it is the same shape in TypeScript.

## The registry — one table, and everything reads from it

```js
const AXES = [
  { key: 'appearance', attr: 'data-theme', def: 'system', label: 'Appearance',
    options: [ {v:'light', label:'Light', icon:'sun'}, {v:'dark', label:'Dark', icon:'moon'},
               {v:'system', label:'System', icon:'monitor'} ] },
  { key: 'palette',    attr: 'data-palette',       def: 'instrument', preview: 'swatch',  options: [...] },
  { key: 'radius',     attr: 'data-radius',        def: 'medium',     preview: 'radius',  options: [...] },
  { key: 'density',    attr: 'data-density',       def: 'comfortable',preview: 'density', options: [...] },
  { key: 'type-scale', attr: 'data-type-scale',    def: 'medium',     preview: 'type',    options: [...] },
  { key: 'font',       attr: 'data-font',          def: 'plex',       preview: 'font',    options: [...] },
  { key: 'surface-style', attr: 'data-surface-style', def: 'solid',   preview: 'surface', options: [...] },
  { key: 'motion',     attr: 'data-motion',        def: 'system',     options: [...] },
  { key: 'sound',      attr: 'data-sound',         def: 'off',        options: [...] },
];
```

`label`, `options` and `preview` live here because **this table also renders the panel**. One source for what
an axis is, what it may be, and how it is described — a second list drifts within a week.

## One apply path

```js
function applyAxis(key, value, persist) {
  const a = AXIS[key];
  if (a.values.indexOf(value) < 0) return;
  document.documentElement.setAttribute(a.attr, value);

  // 🔴 The ONE axis with a resolved twin. Inside the single apply path, never at each call site,
  // where it would eventually be missed and leave a `system` user unstyled.
  if (key === 'appearance') {
    document.documentElement.setAttribute('data-appearance', resolve(value));
  }
  if (persist) writePref(key, value);
  syncPanel();
}
```

`syncPanel()` re-reads from `<html>`, never from a local copy — so a URL axis, a Reset, and the OS flipping
while `system` is selected all land identically.

## The pre-paint script

Runs in `<head>`, before any module exists to call. It carries three couplings, all documented at both ends:
the physical key is `<namespace>:<key>`, strata stores a **JSON wrapper** so the value is at `.value`, and the
`?axis=` URL form outranks storage and must be read *here* too — reading it only in the app paints the stored
value first and corrects it a frame later, which is the flash the script exists to prevent.

```js
for (let i = 0; i < AXES.length; i += 1) {
  const v = read(AXES[i][0], AXES[i][2]) || AXES[i][3];
  applied[AXES[i][0]] = v;
  r.setAttribute(AXES[i][1], v);
}
r.setAttribute('data-appearance', applied.appearance === 'system'
  ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  : applied.appearance);
```

## No cursor axis (owner, 2026-10-26)

The cursor axis (site-wide custom cursor with an off switch, 2026-08-01) is **retired**: every project uses the
browser's default pointer, no layer, no `cursor: none`, no axis row. An existing one is removed, dummy first
(`rules/frontend-ui-standards.md`; Rent Party D-201 is the worked removal).

No cursor layer or follower, no `cursor: none`, no `cursor: url(…)`; the CSS keywords (`pointer`, `text`,
`grab`, `not-allowed`) are the browser's own and stay. Removal covers the axis row in the pre-paint table and
the panel, its catalogue words, icons, CSS, layer, tests and parity hashes; a stored value for the old axis is
ignored, never migrated. Why: on Rent Party it vanished under page tours and React Aria popovers, and a painted
cursor can never show over native lists, pickers or iframes. **The only exception** is the owner's own typed
request for one project, recorded there as `## Custom cursor exception`.

## The sound axis — the only one that defaults OFF

`sound` (`on · off`, **default `off`**, owner directive 2026-08-01) is the one axis that starts off: a channel
that is welcome to the people who ask for it and intolerable to everyone else. The off default is what makes
it defensible — a product that beeps unasked is muted at the OS level, and a muted tab loses the one sound
that mattered along with the rest.

🔴 **Consumers read the attribute, never a cached boolean.** The axis can change at any moment from the panel,
and a value captured at module load ignores the user switching it off — the same defect as gating animation on
`gsap.matchMedia`, one row down in the table below.

```js
function soundEnabled() {
  return document.documentElement.getAttribute('data-sound') === 'on';
}
```

It is **not** bound to `prefers-reduced-motion`. That preference is about movement and vestibular safety;
tying audio to it means someone who reduced motion can never have sound. Separate axis, separate decision.

The cue budget, the first-gesture autoplay gate and the WebAudio implementation that ships no audio files
live in `aoneahsan-cccs-interaction-feedback/references/sound.md` — this file owns only the axis.

## 🔴 The four gates, each shown failing

A gate nobody has watched fail is a gate nobody has verified.

### 1. Axis reach — **execute** the script, never pattern-match it

```js
const src = [...document.querySelectorAll('head script:not([src]):not([type])')]
  .map(s => s.textContent).find(t => t.includes('AXES'));
const written = {};
new Function('document','localStorage','location','matchMedia', src)(
  { documentElement: { setAttribute: (k,v) => { written[k] = v; }, getAttribute: () => null } },
  localStorage, location, matchMedia);
// every expected attribute must be a key of `written`
```

**Proven by reproducing the defect:** mutating the loop to `i < 1` reported **2 of 10 written, FAIL** — while
the *live page still showed all nine attributes*, because the app re-applies them at DOMContentLoaded. An
attribute-presence check passes on a page that flashes every single load.

### 2. Contrast — the two traps that fake a result

Both cost real time on LabFlow before being diagnosed:

- 🔴 **Reading a computed colour in the same task as the attribute write returns the PREVIOUS value.** A loop
  that set `data-palette` then measured reported all three treatments identical — which looks exactly like a
  component hardcoding a colour, the very defect the sweep exists to find. **Two `requestAnimationFrame`s.**
- 🔴 **Measuring during a transition returns a colour belonging to no design state.** The sweep reported the
  primary CTA failing AA in **five of six** combinations when nothing was wrong. **Freeze first:**
  `*{transition:none!important;animation:none!important}`.

Carry a control that must fail — white-on-white returning `1.00` — or a passing sweep proves nothing.

### 3. Persistence — read the physical key back

Set every axis to a non-default, reload, and read `localStorage` directly. Reading the config or the store is
not evidence; a wrong namespace round-trips perfectly on the wrong key.

### 4. Overflow — walk elements, and separate the two kinds

At 320px, walk elements rather than trusting `documentElement.scrollWidth`, and **discount anything inside an
`overflow-x` scroller** — a wide table in its own scroller is correct. LabFlow's naive walk reported 279
overflows; all of them were table cells, and the genuine count was zero. Inject a deliberately wide box to
confirm the walk can still see one.

## Four more mistakes

| Mistake | What happens |
|---|---|
| Building a panel and never appending it to the document | `aria-controls` is set, every attribute check passes, and the element exists nowhere. Caught only by asking the DOM for it — the "built but not wired" shape |
| Authoring OKLCH without checking the gamut ceiling | at hue 294 the maximum chroma is 0.249 at L45; authoring 0.268 is silently clamped, so every figure computed from the authored value is fiction |
| Leaving `--ink-muted` as a literal in the appearance block | no treatment can reach it — it stays one colour while everything around it moves, and a contrast failure there is invisible because it never changes |
| Gating animation on `gsap.matchMedia` alone | that reads the OS only, so the in-app Motion axis appears in the panel, persists correctly, and changes nothing |

**Related:** `patterns.md` (store, sync, cards, hydration) · `aoneahsan-cccs-tailwind-v4` (multipliers and the
specificity trap) · `aoneahsan-cccs-click-dummy` (where this is designed and approved before any framework
code exists).


---

## The overlay-contrast rule

A floating badge, a scroll-progress bar — anything painted over surfaces it is not
inside. **Give it the accent and it will one day be drawn on a band whose background IS the accent.**
Measured, not imagined: `--color-accent-ink` and `--color-band-gold` both computed to
`oklch(0.75 0.1648 68)` in one treatment, so the overlay (then a custom cursor, now banned) was invisible over that whole section.

🔴 **The obvious fix cannot work.** These layers live on `document.body` and are `position: fixed` —
**siblings** of the bands, not descendants — so an `--overlay-ink` override written on `.band-gold`
never reaches them. It produces a clean diff, a green build and an unchanged bug.

The shape that works: a registry of every surface class that **paints** a background · resolve the
surface under the overlay on a **boundary event** (`mouseover`), never per animation frame · stamp it
(`data-band="gold"`) · take the value from **that surface's own on-surface ink token**, which already
carries a measured ratio against exactly that background.

🔴 **It has no gate unless you build one**, because nothing checks a fixed decoration against whatever
is scrolled under it. Parse the stylesheet for every band that sets a `background` and fail when one
has no mapping and no declared reason — the failure this prevents is the band added months later by
someone with no reason to think about a pointer layer defined in another file. Strip CSS comments
before parsing, and watch it fail against a new unmapped band *and* against the known-bad band's own
mapping removed.

Full law: `~/.claude/rules-detail/frontend-ui-standards.md` §16.

---

## Common mistakes

| Mistake | What happens | Instead |
|---|---|---|
| A button per axis in the header | most axes end up with no surface at all | one icon, one panel |
| Hand-written `setAttribute` per axis | a later edit drops some; every axis still *looks* declared | one table, one loop |
| Only the theme applied pre-paint | density and text size reflow the page after first paint | all axes, pre-paint |
| Asserting an axis is *declared* | passes while the write path emits one | **execute** the script and count what it writes |
| Theme applied in a React effect | paints light, then snaps to dark | a head script |

**Four more in `references/axis-registry.md`**, including the two that faked measurements — reading a computed
colour in the same task as the attribute write, and measuring during a transition.
## Body text moved from SKILL.md

### The overlay-contrast summary

A floating badge, a progress bar. **Give it the accent and one day it is drawn on
a band whose background IS the accent** — measured, both `oklch(0.75 0.1648 68)`, pointer invisible.
🔴 The obvious fix cannot work: the layer is `position: fixed` on `<body>`, a **sibling** of the
bands, so no custom property set on a band reaches it. Resolve the surface under it on a boundary
event, stamp it, and take the value from that surface's own on-surface ink token. 🔴 It has **no
gate unless you build one**. Mechanism, gate and the two ways to fake the verification:
`references/axis-registry.md` → "The overlay-contrast rule" · law:
`rules-detail/frontend-ui-standards.md` §16.

### The consumption mechanisms

- **Multipliers for anything numeric** — `--density` and `--type-scale` as `calc()` factors on *every* spacing
  and size token, so an axis cannot miss one: `--sp-4: calc(1.125rem * var(--density))`.
- **Compose, don't override.** A `[data-surface-style]` rule is (0,2,0) and loses **silently** to a
  `[data-palette][data-appearance]` block at (0,3,0). Give the axis its own token (`--surface-alpha`) and let
  the surface classes compose it.

**A component that breaks under one axis is the bug the axes exist to surface** — cheaper across ~90
primitives than across 85 pages, which is why the control is built before the component library.

### Preference vs resolved appearance

`data-theme` is the **preference** and may be `system`; `data-appearance` is the **resolved** light|dark it
paints from. A stylesheet cannot express `system`, so the resolve happens in script, inside the single apply
path — with a live `prefers-color-scheme` listener, so the app follows the OS when it changes rather than only
at load.

### The registry failure on record

This is not tidiness. The recorded failure (`~/.claude/rules/frontend-ui-standards.md` §10) is a project whose
CSS was byte-faithful across six axes while only three were ever **written** to the DOM, and whose test
asserted each axis was *declared* — which passed, because the name appeared in the table a few lines above the
loop. **Count them: the table, the state interface and the apply path must agree.**

### The two entry-point incidents

**Cycling is fine for two states and wrong for nine** — and the axes that are not one of those buttons end up
with *no surface at all*. LabFlow shipped exactly that: two cycle-buttons, seven axes unreachable.

One project exposed its axes only in a home-page band, so every other route had no way to change anything.
