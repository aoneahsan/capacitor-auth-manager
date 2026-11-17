# The dial catalogue and the harness

Depth behind `SKILL.md`. What to expose per component family, and the two implementations of the same
contract.

## The harness contract

```
data-pg="<component-id>"        the live instance the knobs drive — exactly one per playground
data-pg-dial="<name>"           a control that writes one dial
data-pg-value="<name>"          a readout of the current combination (so a screenshot is self-describing)
```

Every playground carries a **Reset** and a **Copy link** — copy writes the current dials into the query
string, which is how a reviewer reports a broken combination without describing it.

🔴 **One owner creates the panel.** The script that drives it also builds it, behind an idempotent guard, and
renders the controls **from the dial registry it already holds**. A panel hand-copied into eight gallery files
is `aoneahsan-cccs-click-dummy/references/pitfalls.md` §4: the first file works and the other seven silently
do not, while every static check passes.

```js
if (root.querySelector('.pg-panel')) return;   // a file may already carry it
// …createElement + textContent. Never innerHTML — that is a project gate at zero.
```

## Per family — what to expose

Trim what a component genuinely cannot vary, and **say what you trimmed**.

| Family | Dials that find real bugs |
|---|---|
| **Button / action** | label length (1 word → 6) · icon none/leading/trailing/only · pending · disabled · full-width · destructive |
| **Field** | value empty/typical/at-max · error none/one/three-line · description on/off · required · read-only vs disabled · character count near and over the limit |
| **Select / combobox** | option count 0 / 3 / 500 · longest option · grouped · async-loading · nothing-matches · a pre-selected value longer than the trigger |
| **Table** | rows 0 / 1 / 25 / 10k · columns 3 / 12 (horizontal scroll) · one cell with 300 characters · all-null column · sorted · selection none/some/all · dense · loading · error |
| **Card / list** | items 0 / 1 / typical / 200 · with and without media · title that wraps to three lines · missing optional fields |
| **Stat** | value 0 · negative · 999,999.99 · null ("—") · delta up/down/flat · unit present/absent |
| **Toast / banner** | each variant · with and without action · two-line body · **stacked ×5** |
| **Overlay** | body that fits vs body that scrolls · long title · footer with 1 and 3 actions · opened near a viewport edge |
| **Avatar / badge** | image · initials · fallback · group overflow (+9) · longest badge label |
| **Nav** | active item · nested groups · collapsed · a label that will not fit · 20 items (scroll) |
| **Rich text** | empty (placeholder) · a paragraph · every mark at once · a nested list · a table inside prose · over the character limit |

### Charts

```
series      1 · 3 · palette max · palette max + 1   (does the ramp degrade or repeat?)
points      1 · 7 · 365
values      typical · with zeros · with negatives · with nulls (gap, not zero)
            one spike (does everything else flatten?) · all-equal (a zero-width domain)
labels      short · long category names · long axis units
states      loading (chart-shaped skeleton) · empty · error
width       320 · 768 · 1440
```

🔴 **All-equal values is the one nobody tries.** A naive linear scale over a zero-width domain divides by
zero and renders either nothing or a line off-canvas.

🔴 **The frame must not move.** Change the data through every dial and the chart's
`getBoundingClientRect()` must be *identical*, not merely plausible — a constant `viewBox` and a constant
scale range, with only `.domain()` responding. That is pitfall 6 in `-click-dummy`, which shipped as a
signature element that shrank on first use and grew for 110 days.

Every chart also exposes its **data table** — the primary accessible form, not a consolation
(`aoneahsan-cccs-d3-charts`).

## Vanilla — the click dummy

No build step, so it is plain ES5-in-a-file, matching the dummy's other shared scripts.

```js
(function () {
  var DIALS = {
    data:  ['empty', 'one', 'typical', 'dense', 'extreme', 'long-text', 'rtl'],
    state: ['default', 'loading', 'error', 'disabled', 'selected'],
    size:  ['sm', 'md', 'lg'],
  };

  function readDials() {
    var q = new URLSearchParams(location.search), out = {};
    Object.keys(DIALS).forEach(function (k) {
      var v = q.get(k);
      out[k] = DIALS[k].indexOf(v) > -1 ? v : DIALS[k][0];
    });
    return out;
  }

  function apply(host, dials) {
    Object.keys(dials).forEach(function (k) {
      host.setAttribute('data-pg-' + k, dials[k]);       // CSS reacts to state/size
    });
    render(host, DATASETS[dials.data]);                   // JS re-renders on data
  }

  // 🔴 URL only — never written to the store. Preferences persist; demo axes do not.
  function setDial(host, key, value) {
    var q = new URLSearchParams(location.search);
    q.set(key, value);
    history.replaceState(null, '', location.pathname + '?' + q);
    apply(host, readDials());
  }
})();
```

## React — the app's `/_gallery`

```tsx
const [dials, setDials] = useSearchParamsState({ data: 'typical', state: 'default', size: 'md' });
const rows = DATASETS[dials.data];

<PlaygroundPanel dials={DIALS} value={dials} onChange={setDials} />
<DataTable rows={rows} size={dials.size} isPending={dials.state === 'loading'} />
```

One instance below the panel; the state row stays above it. The route is dev-only and tree-shaken from the
production build — verify that the way the test-auth hooks are verified: `grep -r "PlaygroundPanel" dist/`
returns nothing.

## Datasets

Deterministic, and dates relative to today so the prototype never looks stale — the same rule as the dummy's
`seed.js`. Build them once, share them across every playground:

```js
var DATASETS = {
  empty:     [],
  one:       [row(0)],
  typical:   range(8).map(row),
  dense:     range(250).map(row),
  extreme:   range(10000).map(row),
  'long-text': [row(0, { title: 'Verlängerungsantrag Betriebshaftpflichtversicherung 2026' })],
  rtl:       [row(0, { title: 'تقرير المختبر الشهري', dir: 'rtl' })],
};
```

🔴 **No lorem ipsum, and no invented numbers.** A layout that only works with placeholder text does not work —
the same rule as the rest of the dummy.

**Last updated:** 2026-08-01
