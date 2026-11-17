# JavaScript patterns

## Modules

ES modules everywhere. Named exports by default — they are greppable, renameable by tooling, and
tree-shakeable. Reserve `export default` for genuine single-export modules (a React component file, a config
object).

Import order, enforced by lint where possible: node builtins → external packages → internal aliases (`@/…`) →
relative → styles. Absolute `@/` imports for anything outside the current folder; relative only for siblings.

Barrel files (`index.ts` re-exporting a folder) are convenient and can defeat tree-shaking — use them for
small, cohesive folders, not as a project-wide habit.

## Iteration

```js
// A single pass beats three when the array is large.
const activeNames = users.reduce((acc, u) => {
  if (u.isActive) acc.push(u.name);
  return acc;
}, []);

// But prefer clarity at small sizes — this reads better and the cost is irrelevant:
const activeNames = users.filter(u => u.isActive).map(u => u.name);
```

Optimise the second form into the first only when you have measured that it matters. Premature optimisation
is an explicit anti-goal.

`for...of` for early exit and for `await`-ing in sequence. `.forEach()` cannot `break` and does not await —
it is the wrong tool for both.

## Fetch with a timeout

```js
async function fetchJson(url, { timeoutMs = 10_000, ...init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
```

Note `finally` — the timer is cleared whether the request succeeds, fails, or aborts.

## Error with cause

```js
try {
  await saveProfile(profile);
} catch (error) {
  throw new Error('Could not save your profile', { cause: error });
}
```

`cause` preserves the original for the logger while the message stays useful to a human.

## Debounce and throttle

Prefer the platform where it fits: `IntersectionObserver` instead of a scroll listener, `ResizeObserver`
instead of a resize listener, CSS `scroll-behavior` instead of a scroll animation loop. When a debounce is
genuinely needed, `AbortController` + `setTimeout` is usually less code than a dependency.

## Number and date formatting

```js
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1234.5);
new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-3, 'day');   // "3 days ago"
```

Construct the formatter once and reuse it — construction is the expensive part.
