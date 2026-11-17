---
name: aoneahsan-cccs-nodejs
description: 'Node.js: version management through nvm, build-time and CLI scripts, environment loading, and the zero-cost rule deciding whether a backend may exist at all and which one. Use when writing a build step or CLI tool, when a feature seems to need a server, or when loading environment variables outside a bundler.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/prompt-logs.md
---

# Node.js

## First, decide whether a backend should exist

Default: **it should not.** Features run client-side, on free tiers, with no servers and no usage billing.

Pre-flight — every answer must be yes: Is it client-side, or on a free tier? Is any API free and keyless, or
origin-restricted? Is the package free with healthy adoption? Is there no usage-based billing? **Any "no"
means reject the design and find another shape.**

When something genuinely cannot run in the browser:

| Allowed | Not allowed |
|---|---|
| Cloudflare Workers (free tier) | Firebase Functions |
| FilesHub for file storage **and** outbound email | Firebase Storage; email SaaS; hand-configured SMTP |
| Supabase free tier; Firebase free tier | VPS, paid APIs, paid AI tiers |
| Laravel where a project already has one | Stripe/PayPal (→ the product's own admin-confirmed checkout until the owner names a provider) |

Worker naming is `{project}-{purpose}`; every secret is prefixed `{PROJECT_PREFIX}_{SECRET_NAME}` because all
projects share one Cloudflare account.

## 🔴 A handler runs the ordered gate

Any backend you do write — a Worker, a route, a small server — validates in a fixed order: **request shape
(422) → authentication (401) → authorization (403) → business validity (409/422) → the database**. Nothing
frames the request for you here, so the order is yours to write. A permission check after the write is an audit
trail, not a boundary. Heavy aggregation belongs on this side too, never in the browser:
`aoneahsan-cccs-data-contract`.

## Version management

`nvm` installs and updates Node **and the npm it bundles** — never `npm install -g npm`. Pin the version the
project expects in `.nvmrc` and in `engines`. Node 22 for Cloud Functions-shaped runtimes, current LTS for
apps.

## Environment variables outside a bundler

A plain Node process has `process.env` but **nothing populates it from `.env`** — that is the bundler's job,
and the bundler is not running. Since Node 20.12 this needs no dependency:

```js
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const envFile of ['.env.local', '.env']) {
  const p = resolve(__dirname, envFile);
  if (existsSync(p)) process.loadEnvFile(p);
}
```

Two traps, both real: `loadEnvFile` is **first-wins** (it skips already-set keys), so the most specific file
must be listed **first** to match bundler precedence — and real shell/CI vars then correctly beat both. And it
**throws `ENOENT`** on a missing file, hence `existsSync`. Do **not** add `dotenv`/`dotenvx` for this.

This is exactly the `capacitor.config.ts` failure recorded as ISSUE-003 in
`~/.claude/rules/capacitor-plugins-and-issues.md`.

## Scripts: no files, with one exception

The global rule bans `.sh`/`.py`/`.cjs` files and a `scripts/` folder. Run commands directly or add a
`package.json` script.

The exception the owner has accepted in practice is a **build-step or release tool that the build itself
invokes** — ztools' `postbuild-seo.ts` and `tools/bumpAndroidVersion.ts`. These are program source, wired into
`package.json`, not loose helper scripts. If you write one: open it with a docblock stating why it exists,
make it idempotent, fail loudly with the exact remedy, and never let it silently no-op.

## Node practice

Use `node:`-prefixed builtins. `fs/promises` over sync APIs except in a CLI's startup path. Stream large
files rather than buffering. Exit non-zero on failure — a release tool that fails silently makes a broken
release look green.

For Worker structure and the FilesHub integration shapes, read `references/backend.md`.
