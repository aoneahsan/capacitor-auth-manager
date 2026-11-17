# Theming patterns

## Store

🔴 **Derive the state from the registry rather than declaring it twice.** A hand-written interface beside a
hand-written table is two lists that drift; the failure this file previously carried in its own example was
exactly that — seven axes documented, six typed, five applied.

```ts
export const AXES = [ /* the single table — see axis-registry.md */ ] as const;

type AxisKey   = (typeof AXES)[number]['key'];
type AxisValue<K> = Extract<(typeof AXES)[number], { key: K }>['options'][number]['v'];

interface ThemeState extends Record<AxisKey, string> {
  hydrated: boolean;
  reset: () => void;
}

// 🔴 `appearance: 'system'` is the default WHEN NOBODY HAS DECIDED. An approved design artefact
// overrides it with its own literal value — see SKILL.md.
export const DEFAULTS = Object.fromEntries(AXES.map((a) => [a.key, a.def]));
```

With the defaults derived, adding an axis is one row and the interface, the defaults and the apply path cannot
disagree — which is the whole reason the registry exists.

Persist with `partialize` so `hydrated` never reaches storage — restoring it as `true` before rehydration
actually finishes defeats the gate.

## Resolving `system`

```ts
export function useResolvedAppearance() {
  const appearance = useThemeStore((s) => s.appearance);
  const [system, setSystem] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return appearance === 'system' ? system : appearance;
}
```

The listener is the point — reading the media query once at mount means the app ignores the OS switching at
sunset.

## Applying to the document

🔴 **Every documented axis writes here, or it does not exist.** This effect used to apply five of seven,
hand-written — `neutralTone` was untyped and `panelBackground` was never written — so two cards moved a store
value that reached no stylesheet. **Iterate the registry instead**, and the class of bug goes away:

```ts
useEffect(() => {
  const root = document.documentElement;
  for (const a of AXES) root.setAttribute(a.attr, state[a.key]);
  // the one resolved twin: `system` has no colours of its own
  root.setAttribute('data-appearance', resolved);
}, [state, resolved]);
```

**Numeric axes go through multipliers, not per-property writes** — `--density` and `--type-scale` are `calc()`
factors on every spacing and size token, so an axis cannot reach some and miss others
(`aoneahsan-cccs-tailwind-v4`).

**The gate that makes this stick** — assert the DOM, not the store, because the store being right is exactly
what a dead axis looks like. And 🔴 assert against **the registry**, never a hardcoded list: a gate with its own
copy of the axis names keeps passing after an axis is dropped.

```ts
const applied = document.documentElement.getAttributeNames();
for (const a of AXES) expect(applied).toContain(a.attr);
expect(applied).toContain('data-appearance');
```

For the stronger version — executing the pre-paint script and counting what it actually writes, which is the
only form that catches a write path emitting one axis while all of them stay declared — see
`axis-registry.md`.

## Radius cards that preview themselves

```tsx
{RADII.map((r) => (
  <button
    key={r.value}
    onClick={() => setRadius(r.value)}
    aria-pressed={radius === r.value}
    className="grid place-items-center gap-2 border p-3"
  >
    <span
      className="h-10 w-10 border-2 border-accent-600"
      style={{ borderRadius: RADIUS_PX[r.value] }}   /* the preview IS the value */
    />
    <span className="text-sm">{r.label}</span>
  </button>
))}
```

Same idea for font size (render the label at the size it sets) and panel background (render solid vs
translucent). A user should never have to apply a setting to see what it does.

## Panel shape

Anchored popover from the trigger at ≥640px, full-height sheet below it. **Anchored rather than
full-screen**, because a settings panel covering the page makes it impossible to see what the setting just
did — which is the entire point of a live preview. Provide **Reset to defaults**, and wrap the body in a
scroll area.

## Persistence — the mechanics

The dual-layer table is in `SKILL.md`; this is how it is wired.

**Never raw `localStorage`** — everything goes through `strata-storage`
(`aoneahsan-cccs-strata-storage`). The **pre-paint head script is the one sanctioned exception**, because
nothing exists yet to call. It must read the exact physical key strata wrote — `<namespace>:` + key, holding a
JSON wrapper, so the value is at `JSON.parse(raw).value` — and that coupling is noted at **both** ends. Change
the namespace without touching the script and every page silently reverts to a theme flash, with nothing to
catch it.

**Debounce remote writes ≥500 ms.** Dragging through swatches must not become a write per frame. On sign-out,
keep the local values — the device should still look the way its owner left it.

Every axis is **URL-shareable for review** (`?density=compact`). 🔴 A URL axis is **shown and never
persisted**, or one shared link silently becomes someone's settings.

## Sync service

```ts
export function initThemeSync() {
  onAuthChange(async (user) => {
    if (!user) return;                                   // signed out: keep local as-is
    const remote = await fetchPreferences(user.uid);
    if (remote) useThemeStore.setState(remote);          // remote wins
    else await savePreferences(user.uid, currentPrefs()); // seed the server row
  });

  const push = debounce((s: ThemeState) => {
    const user = currentUser();
    if (user) void savePreferences(user.uid, pick(s, PREF_KEYS));
  }, 500);

  useThemeStore.subscribe(push);
}
```

`void` on the save — a failed preference sync must never break the UI or produce an unhandled rejection.

## Hydration gate

```tsx
const hydrated = useThemeStore((s) => s.hydrated);
const authReady = useAuthStore((s) => s.ready);

if (!hydrated || !authReady) return <BootLoader />;
return <AppShell />;
```

## Verification matrix

Check the primary surfaces against **every axis**, not just light/dark:

| | light | dark |
|---|---|---|
| each colour treatment | body, headings, primary action, focus ring — figures, not "all pass AA" | same |
| each radius | nothing clipped, nothing unintentionally square, focus rings still follow the shape | same |
| each density | no overflow, no truncated labels, touch targets still ≥44px at `compact` | same |
| each text size | headings and body still in proportion; the small end against the 16px floor | same |
| each typeface | metrics differ between families — check anything relying on a fixed line count | same |
| translucent panels | text legible over whatever is scrolled underneath | same |
| motion reduced | every surface still reachable and legible with movement removed | same |
| sound on / off | **off is silent from a fresh profile** — no `AudioContext` is even constructed; turning it off silences immediately, without a reload | same |

**Translucent-over-content is the case that most often fails contrast**, because the effective background
depends on what is scrolled underneath — so it doubles the combination count rather than adding one row.

🔴 **A component that breaks in exactly one cell of this table is hardcoding something.** That is the finding,
not a nuisance: the axes exist to surface it, and it is far cheaper here than after the pages are built.


---

## Persistence — dual layer

Signed out, preferences live in device storage. Signed in, they live in the user record **and** that cache;
on sign-in the remote wins and is written back. **Never raw `localStorage`** — go through **`strata-storage`**,
whose one sanctioned exception is the pre-paint script (nothing exists yet to call), reading the exact physical
key including strata's JSON wrapper.

**Debounce remote writes (≥500ms)**, and keep local values on sign-out. Every axis is also **URL-shareable for
review** (`?density=compact`) — 🔴 **shown, never persisted**, or one shared link silently becomes someone's
settings.

🔴 **A hydration gate holds first paint** behind a full-page loader until the store has rehydrated *and* auth
has resolved, or the app paints its defaults and snaps (`aoneahsan-cccs-react-ui-ux`).

🔴 **`system` is the default only when nobody has decided.** An approved design artefact overrides it, used
literally rather than resolved from the OS — following this skill exactly against a dummy declaring `dark`
ships light while being fully compliant, which is how one rebuild came out wrong
(`~/.claude/rules/frontend-ui-standards.md` §10).
