# Backend shapes

## Cloudflare Worker

One shared Cloudflare account across all projects, so naming discipline is mandatory.

```
workers/<worker-name>/
  wrangler.toml
  src/index.ts
```

- **Worker name:** `{project}-{purpose}` — e.g. `lifewell-gdrive-token-proxy`.
- **Every secret:** `{PROJECT_PREFIX}_{SECRET_NAME}` — e.g. `LEGAL_EAGLE_FILESHUB_KEY`. Without the prefix, a
  `GOOGLE_CLIENT_SECRET` from one project collides with another's.
- Set secrets with `wrangler secret put`, never in `wrangler.toml`.
- **Lock CORS to the project's own domains.** A proxy with open CORS is an open relay for your key.
- Deploy with `wrangler deploy` (auto-authorised for projects under `code/`).

Use a Worker when a secret genuinely cannot be exposed. Note that a **FilesHub key that is origin-restricted
does not need one** — that is the whole reason origin restrictions were built.

## FilesHub

The mandatory provider for **both** file storage and outbound email in every project unless the owner names
something else.

Two integration patterns:

- **A — frontend-direct.** Requires an **origin-restricted** key. Verify the restriction is actually on before
  shipping it: a junk `Origin` must return 403 **and** each real app origin must return 200. An unrestricted
  key returning 202 from a junk origin is not safe to ship.
- **B — server-side.** For unrestricted keys or secret-heavy flows: a Worker proxy, or a Laravel mail
  transport.

Uploads always use `visibility: 'public'` — private objects require the API key to fetch.

The full contract, quirks and per-project registry live in `~/.claude/rules/fileshub-api.md`. Read that; do
not restate it. See also `aoneahsan-cccs-fileshub`.

## Laravel

Where a project already has one: set `SERVER_PORT` in `.env` **and** `.env.example` so `php artisan serve`
binds to the project's registered port — never the 8000 default. See `aoneahsan-cccs-laravel`.

## Build-tool obligations

A tool the build invokes is program source and is held to the same standard as the app:

```ts
/**
 * tools/<name>.ts — invoked by `yarn <script>`.
 *
 * Why this exists: <the reason a package.json script could not do it>
 * Scope: <exactly which files it may write>
 * Idempotent: <what a repeat run does>
 */
```

- **Fail loudly with the remedy.** `throw new Error('dist not found. Run "yarn build" first.')` beats a
  silent no-op that makes a broken release look green.
- **Exit non-zero.** In CI, a zero exit on failure is indistinguishable from success.
- **State the blast radius** — which paths it writes — so a reader can trust it.
