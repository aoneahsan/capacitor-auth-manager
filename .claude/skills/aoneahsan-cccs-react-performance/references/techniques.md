# Techniques

## Measure first

```bash
yarn build        # read the per-chunk size + gzip table Vite prints
npx vite-bundle-visualizer     # what is actually in each chunk
```

In the browser: React DevTools Profiler for render cost, the Performance panel for long tasks, Lighthouse for
Core Web Vitals. Optimise what the profile shows, not what you suspect.

## Route splitting with a meaningful fallback

```tsx
<Suspense fallback={<PageSkeleton />}>
  <Routes>…</Routes>
</Suspense>
```

A skeleton that matches the page's layout prevents the shift that a bare spinner causes when content lands.

## Feature-level dynamic import

```tsx
// One chunk for the whole editor feature — not one per component inside it.
const openEditor = async () => {
  const { RichEditor } = await import('@/features/editor');
  setComponent(() => RichEditor);
};

// Prefetch on intent so the chunk is warm before the click.
<button onMouseEnter={() => import('@/features/editor')} onClick={openEditor}>Edit</button>
```

## Structural fixes beat memoisation

```tsx
// ❌ Every keystroke re-renders <ExpensiveTree/>.
function Page() {
  const [query, setQuery] = useState('');
  return <><input value={query} onChange={e => setQuery(e.target.value)} /><ExpensiveTree /></>;
}

// ✅ State moved down — the expensive tree is outside the re-rendering component.
function Page() {
  return <><SearchBox /><ExpensiveTree /></>;
}
```

```tsx
// ✅ Children as props — <Slow/> is created by the parent, so <Wrapper/>'s state
//    changes do not re-render it.
<Wrapper><Slow /></Wrapper>
```

Both remove the re-render entirely rather than making it cheaper.

## LCP: prerendered hero skeleton

For a prerendered SPA, inject an above-the-fold skeleton into `#root` at build time. React's
`createRoot().render()` replaces the children on first render, so it is purely a paint-fast placeholder that
wins LCP and FCP. ztools does this in `postbuild-seo.ts` — see `aoneahsan-cccs-postbuild-seo-html`.

## Web Worker for blocking work

```ts
const worker = new Worker(new URL('./heavy.worker.ts', import.meta.url), { type: 'module' });
worker.postMessage(payload);
worker.onmessage = (e) => setResult(e.data);
```

Image processing, parsing, compression and anything CPU-bound belongs here. It also keeps a feature
client-side and therefore free — see `aoneahsan-cccs-nodejs`.

## Caching an expensive model or asset

```ts
let modelPromise: Promise<Model> | null = null;
export const getModel = () => (modelPromise ??= loadModel());   // load once per session
```

For assets that survive reloads, cache them rather than re-downloading — through **`strata-storage`**'s
`cache` or `indexedDB` adapter, never the Cache API or `indexedDB` directly
(`aoneahsan-cccs-strata-storage`). A 40-second first run is tolerable; a 40-second *every* run is the bug.

## Core Web Vitals targets

| Metric | Good | Usual cause when bad |
|---|---|---|
| **LCP** ≤ 2.5s | above-the-fold content | unoptimised hero image, render-blocking JS |
| **INP** ≤ 200ms | interaction responsiveness | long tasks on the main thread |
| **CLS** ≤ 0.1 | layout stability | images without dimensions, late-injected banners |

## Vite build settings

```ts
export default defineConfig({
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  build: {
    sourcemap: false,             // never ship source maps
    chunkSizeWarningLimit: 2000,  // deliberate — investigate breaches, do not keep raising it
    reportCompressedSize: true,   // the gzip table IS the build's useful output
  },
});
```
