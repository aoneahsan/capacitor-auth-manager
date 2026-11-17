# Web performance audit — Core Web Vitals

How to profile a page's real load performance and turn the numbers into specific fixes. Retrieval-first for
exact thresholds/weights — fetch `https://web.dev/articles/vitals` and
`https://developer.chrome.com/docs/lighthouse/performance/performance-scoring` before quoting numbers, as they
shift.

## Tooling on this machine

The audit drives a real browser. Use the **kept `superpowers-chrome` `use_browser` tool** (or raw Chrome
DevTools Protocol — node ≥22 has a global `WebSocket`, no dependency needed) to navigate, reload with a
performance trace, and read network + DOM. This replaces the source skill's `chrome-devtools` MCP dependency,
which is not installed here. The run-to-verify grant covers spinning a background server on the project's
registered port to profile a local build; kill it after.

## Core Web Vitals (the three that rank)

| Metric | Measures | Good (retrieve to confirm) |
|---|---|---|
| **LCP** — Largest Contentful Paint | Loading — when the main content paints | ≤ 2.5 s |
| **INP** — Interaction to Next Paint | Responsiveness — input → next paint | ≤ 200 ms |
| **CLS** — Cumulative Layout Shift | Visual stability — unexpected shift | ≤ 0.1 |

Supplementary: FCP (first paint), TBT (total blocking time — lab proxy for INP), Speed Index.

## Audit workflow

1. **Trace:** navigate to the URL, start a performance trace with reload, let it auto-stop.
2. **Core Web Vitals:** read LCP/INP/CLS; for CLS, identify the shifting elements (usually images/ads/late
   fonts with no reserved space).
3. **Network:** list script/stylesheet/font/image requests; find render-blocking resources, long dependency
   chains, missing caching headers, uncompressed assets.
4. **Accessibility snapshot:** a quick pass for obvious gaps (labels, contrast, focus order).
5. **Codebase** (skip for a third-party site): tie each finding to a file — the oversized image, the
   render-blocking import, the layout-shifting component.

## Turning numbers into fixes

- **Be specific + quantified:** "compress hero.png (450 KB) → WebP (~60 KB)" — not "optimize images". Use each
  insight's estimated savings; ignore 0 ms "issues".
- **Verify before recommending:** confirm a resource is actually unused before saying to remove it.
- **Prioritise ruthlessly:** a page at 200 ms LCP / 0 CLS is already excellent — say so and stop, don't invent
  work.

## Common wins (React SPAs)

- Lazy-load routes + heavy libraries (charts, editors) — see the parent skill's code-splitting section.
- Reserve space for images (explicit `width`/`height`) and late fonts (`font-display: swap`) to kill CLS.
- Preconnect/preload the LCP image; avoid a render-blocking font/CSS chain.
- Ship no source maps in production; investigate what tripped `chunkSizeWarningLimit` rather than raising it.
- An unbounded data fetch is a perf bug too — the 20/50 budget lives in `aoneahsan-cccs-react-api-tanstack-query`.
