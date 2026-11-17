# Build gate and headers

## `vite/pwa-no-cache.ts` (a TypeScript Vite plugin, not a script file)

```ts
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

/** Old worker addresses a browser may still have registered; each gets a copy of the cache-free worker. */
const RETIRED_WORKER_PATHS: string[] = [];
const REQUIRED_FIELDS = ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'theme_color', 'background_color', 'icons'];
/* Behaviour, not names: the worker's own LEGACY_CACHE pattern names `precache` and `workbox-` caches to delete them. */
const BANNED_IN_WORKER = [
  /addEventListener\(\s*['"`]fetch['"`]/,
  /\bonfetch\b/,
  /caches\.open\(/,
  /\b(cache|c)\.(put|add|addAll)\(/,
  /__WB_MANIFEST/,
  /precacheAndRoute|registerRoute/,
  /importScripts\([^)]*workbox/,
  /* A minifier writes string literals as template literals (`fetch`), so every quote form counts. */
];
const BANNED_IN_BUNDLE = [/workbox-window/, /virtual:pwa-register/, /registerSW\.js/];

/**
 * Installable PWA with no caching: stamps the build into dist/sw.js, copies it to retired worker
 * addresses, writes dist/version.json for the connectivity probe, and fails the build on any cache code.
 * Law: ~/.claude/rules/pwa-no-cache.md · skill aoneahsan-cccs-pwa-no-cache.
 */
export function pwaNoCache({ version, manifest = 'manifest.webmanifest' }: { version: string; manifest?: string }): Plugin {
  let config: ResolvedConfig;
  let entry = '';
  const fail = (msg: string): never => { throw new Error(`[pwa-no-cache] ${msg}`); };
  return {
    name: 'pwa-no-cache',
    apply: 'build',
    configResolved(resolved) { config = resolved; },
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk') continue;
        if (file.isEntry && !entry) entry = file.fileName;
        for (const re of BANNED_IN_BUNDLE) if (re.test(file.code)) fail(`${file.fileName} contains ${re} — remove the PWA plugin`);
      }
    },
    /* Last, after any plugin that writes the manifest or prerenders pages in its own closeBundle. */
    closeBundle: { order: 'post', handler() {
      if (config.build.ssr) return;
      const out = resolve(config.root, config.build.outDir);
      if (!existsSync(join(out, 'index.html'))) return;
      const pkg = JSON.parse(readFileSync(resolve(config.root, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const banned of ['vite-plugin-pwa', 'workbox-window', 'workbox-build']) if (deps[banned]) fail(`${banned} is installed`);

      const swPath = join(out, 'sw.js');
      if (!existsSync(swPath)) fail('dist/sw.js missing');
      let sw = readFileSync(swPath, 'utf8');
      if (!sw.includes('__BUILD_STAMP__')) fail('sw.js has no __BUILD_STAMP__ marker');
      for (const re of BANNED_IN_WORKER) if (re.test(sw)) fail(`sw.js matches ${re} — the worker must not cache or intercept fetch`);
      if (!entry) fail('no entry chunk found to stamp');
      sw = sw.replace('__BUILD_STAMP__', `${version} ${entry}`);
      writeFileSync(swPath, sw);
      for (const retired of RETIRED_WORKER_PATHS) copyFileSync(swPath, join(out, retired));

      const manifestPath = join(out, manifest);
      if (!existsSync(manifestPath)) fail(`${manifest} missing`);
      const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown> & {
        icons?: Array<{ sizes: string; purpose?: string; src: string }>;
      };
      for (const field of REQUIRED_FIELDS) if (!parsed[field]) fail(`manifest is missing "${field}"`);
      const sizes = parsed.icons ?? [];
      for (const need of ['192x192', '512x512']) if (!sizes.some((i) => i.sizes === need)) fail(`manifest has no ${need} icon`);
      if (!sizes.some((i) => i.purpose?.includes('maskable'))) fail('manifest has no maskable icon');
      for (const icon of sizes) if (!existsSync(join(out, icon.src.replace(/^\//, '')))) fail(`icon ${icon.src} not in dist`);

      const versionPath = join(out, 'version.json');
      if (!existsSync(versionPath)) writeFileSync(versionPath, JSON.stringify({ version, entry }));
    } },
  };
}
```

Wire it in `vite.config.ts`: `import { pwaNoCache } from './vite/pwa-no-cache.ts'` — 🔴 **with the `.ts` extension** (Vite's
native config loader refuses an extensionless relative import), so the node tsconfig needs
`"allowImportingTsExtensions": true` and `"vite"` in its `include` — then `plugins: [..., pwaNoCache({ version: pkg.version })]`. A project whose manifest has another established name passes it (`pwaNoCache({ version, manifest: 'manifest.json' })`);
never rename a shipped manifest just for this. A project that GENERATES its worker in its own plugin appends the
marker line to the emitted code. Projects whose update flow
already stamps the worker (an existing `closeBundle` step) fold that step into this plugin — one stamper, never
two. If the project already serves a release/version endpoint the probe may use it instead of `version.json`;
whichever it is must be same-origin, tiny and `no-store`.

🔴 Prove the gate: add `self.addEventListener('fetch', () => {})` to `public/sw.js`, run `yarn build`, see it
fail with the plugin's message, remove the line, build green. Paste both outputs in the run log.

## Headers (Cloudflare Pages `public/_headers`)

```
/
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/sw.js
  Cache-Control: no-cache
  Service-Worker-Allowed: /
/manifest.webmanifest
  Cache-Control: no-cache
  Content-Type: application/manifest+json
/version.json
  Cache-Control: no-store
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

Merge into the project's existing `_headers` (CSP blocks stay); every prerendered route's HTML is `no-cache` too
(`/*.html` or per-section rules). Firebase Hosting (until migrated): the same rules in `firebase.json` `headers`.
Confirm on the live host: `curl -sI https://<host>/sw.js | grep -i cache-control`.

🔴 **`curl https://<host>/version.json` must return the JSON, not HTML.** A project whose `_redirects` rewrites unknown
one-segment paths (a bio-page or SPA fallback such as `/:slug /shell/ 200`) and lists real files explicitly will send
`version.json` to that page, because the gate writes it after the list was made — and then the probe never succeeds and
the screen never lifts (TrizLink, 2026-11-17). Add `version.json` to the project's pass-through list.
