# Sound — the opt-in channel

Owner directive 2026-08-01: sound effects belong in our products *where they make sense*. This file is what
"makes sense" means, and the constraints that keep the channel usable rather than muted.

## 🔴 Off by default, and that is what makes it defensible

`sound` is an axis in the one theme control (`aoneahsan-cccs-react-theming`), `on · off`, **default `off`**.

The reason is not timidity. A product that beeps unasked gets muted **at the browser or OS level**, and a
muted tab loses every sound including the one that mattered. Off-by-default costs a first-impression flourish
and keeps the channel available to the people who switch it on. A user who turns it on has told you the sound
is welcome, which is the only condition under which it is.

```
| Sound         | data-sound  | on · off  |   ← default off
```

## The three-sound budget

**At most three sounds in a product.** Not a style preference — a discrimination limit. Past three, users
stop distinguishing them and the set becomes ambience, at which point it is noise with extra steps.

The three that earn their place:

| Sound | Fires on | Character |
|---|---|---|
| **confirm** | a consequential action completing — sent, published, saved | short, rising, quiet |
| **alert** | a failure the user must notice, or an event arriving from outside | short, falling, slightly louder |
| **tick** | a discrete state commit the user is repeating — check, toggle, step | very short, near-silent, felt more than heard |

**Nothing else gets a sound.** Not navigation, not hover, not typing, not opening a menu, not a page load.

## 🔴 Never the only channel

A sound is an *additional* channel on top of the visual state change and the announcement. Anything conveyed
by sound alone is unavailable to a deaf user, a muted tab, a user with the axis off — which is everyone by
default — and anyone in a room where they cannot use audio. If removing the sound loses information, the
design is wrong before the sound was added.

## The gesture gate

Browsers refuse to start audio before the user has interacted with the page, and **the refusal is silent** —
an `AudioContext` created at load sits in `suspended` and every later sound does nothing, with no error to
notice. So the context is created lazily on the first real gesture and resumed if suspended.

```js
let ctx = null;

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();   // needed after a tab-level autoplay block
  return ctx;
}
```

## Synthesise it — ship no audio files

Three short cues do not justify three network requests, a loader, a cache policy and a licence check. WebAudio
generates them in a few lines, they are theme-able, and they add nothing to the bundle.

```js
const CUES = {
  confirm: { f: [523.25, 783.99], d: 0.11, g: 0.05 },   // C5 → G5
  alert:   { f: [440.0,  329.63], d: 0.16, g: 0.07 },   // A4 → E4
  tick:    { f: [1046.5],         d: 0.03, g: 0.03 },
};

export function cue(name) {
  if (!soundEnabled()) return;                    // the axis — checked FIRST, always
  const spec = CUES[name];
  if (!spec) return;

  const c = audio();
  const t0 = c.currentTime;
  const gain = c.createGain();
  gain.connect(c.destination);

  // An envelope, not a raw gate: a square-edged tone clicks, and the click is
  // what makes cheap UI sound cheap.
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(spec.g, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.d);

  spec.f.forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0 + i * (spec.d / spec.f.length));
    osc.connect(gain);
    osc.start(t0 + i * (spec.d / spec.f.length));
    osc.stop(t0 + spec.d);
  });
}
```

Peak gain stays ≤0.07. A UI cue that can be heard over music is too loud.

## Reading the axis

```js
function soundEnabled() {
  return document.documentElement.getAttribute('data-sound') === 'on';
}
```

🔴 **Read the attribute, not a cached boolean.** The axis is stamped on `<html>` pre-paint and can change at
any moment from the theme panel; a value captured at module load ignores the user turning it off, which is the
one thing this axis exists to guarantee. Same shape as the motion-axis mistake in `aoneahsan-cccs-motion`.

Sound is **not** governed by `prefers-reduced-motion` — that preference is about vestibular safety and
movement, and silently binding audio to it means a user who reduced motion can never have sound. It has its
own axis for exactly this reason.

## Where it attaches

In the **primitive**, alongside the analytics and error wiring, never in feature code
(`aoneahsan-cccs-react-ui-ux` — instrument at the primitive layer). One call in the toast dispatcher and one
in the form-submit result covers the whole product:

```ts
// in the toast primitive
if (variant === 'error') cue('alert');
else if (variant === 'success') cue('confirm');
```

A feature author never writes `cue()`. If they need to, a primitive is missing.

## Native

On Capacitor, the equivalent decision is **haptics**, not audio — a phone in a pocket is felt, not heard, and
the OS already owns system sounds. `@capacitor/haptics`, gated on the same axis, per
`aoneahsan-cccs-capacitor-packages-setup`.

## Verifying

- **A fresh profile is silent.** No `AudioContext` is constructed at all until the axis is switched on.
- **Nothing is attempted before the first gesture** — a context in `suspended` at load is the tell.
- **Turning the axis off silences it immediately**, without a reload. That is the cached-boolean bug above.
- **The axis survives a reload**, verified by reading the physical `localStorage` key, never the config
  (`aoneahsan-cccs-strata-storage` — the `namespace` trap).

**Last updated:** 2026-08-01 (created — owner directive; default off, confirmed the same session)
