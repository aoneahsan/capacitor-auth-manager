---
name: aoneahsan-cccs-capacitor
description: 'Capacitor in React projects: the native shell, config and the env-loading trap that silently ships empty values, platform branching, safe-area ownership, the TypeScript pin that keeps cap sync working. Use when adding Capacitor, editing capacitor.config.ts, running cap sync, or when native differs from web.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/projects/ztools-capacitor-android.md
---

# Capacitor

**Add Capacitor to every React web project.** One codebase produces the website and the Android app; iOS
follows when there is an Apple Developer account. This is *why* mobile-first and 100% responsive are
non-negotiable — see `aoneahsan-cccs-frontend-development`.

## 🔴 Trapeze is required

Every Capacitor project keeps the latest stable `@trapezedev/configure` dev dependency, root
`apps-config.yaml`, and this exact package script:

```json
"sync:apps-config": "trapeze run apps-config.yaml"
```

It is configuration-driven tooling, so no application imports is not a removal signal. Never remove it as
unused, redundant, or a second authority. Adapt the YAML to the project's guarded native config and run the
script before `cap sync` or a native build whenever managed values change. An Android-only project keeps an
Android-only YAML until iOS is deliberately restored.

## 🔴 `capacitor.config.ts` cannot read your `.env`

The single highest-value trap in this stack, because **it fails silently**: `VITE_*` values resolve to `""`
and ship into the native config. Google Sign-In is simply dead on device, with no error anywhere.

The cause: the CLI transpiles the config to CommonJS and `require`s it in a plain Node process. `process.env`
exists but nothing populates it — loading `.env` is Vite's job, and **Vite never runs during `cap sync`**.
`import.meta.env` does not exist in that context at all.

The fix needs no dependency (Node ≥ 20.12):

```ts
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const envFile of ['.env.local', '.env']) {
  const p = resolve(__dirname, envFile);
  if (existsSync(p)) process.loadEnvFile(p);
}
```

Two traps inside the fix: `loadEnvFile` is **first-wins**, so the most specific file must be listed **first**
to match Vite's precedence — and it **throws `ENOENT`**, hence `existsSync`. Do not add `dotenv`/`dotenvx`.

**Verify the generated file, not the source** — `capacitor.config.ts` is usually outside `tsconfig.include`
and the lint ignores, so typecheck and lint will not catch mistakes in it:

```bash
npx cap sync android && grep -A6 '"GoogleAuth"' android/app/src/main/assets/capacitor.config.json
```

**Fail loudly** when a required value is missing — throw in the config naming the variable. That turns a
silent broken release into a build error.

Fleet record: `~/.claude/rules/capacitor-plugins-and-issues.md` → ISSUE-003.

## Google sign-in on Android: the web client id is the one to use

**The owner's rule (2026-10-25, Rent Party):** a Capacitor Android app uses the **web** OAuth client id everywhere
(`serverClientId` in the plugin config, `VITE_GOOGLE_WEB_CLIENT_ID`, and Supabase's Google client list). Never ask
the owner for an "Android client id", and never put one in code or in Supabase.

🔴 **Google still needs an Android client to exist** for the package and each signing SHA-1, or native sign-in fails
with `DEVELOPER_ERROR` (code 10). Nothing references its id. Create it without the console: register the SHA-1 on
the project's Firebase Android app, and Google creates the client automatically.

```bash
npx -y firebase-tools@latest apps:android:sha:create <androidAppId> <SHA1> --project <id>
npx -y firebase-tools@latest apps:sdkconfig ANDROID <androidAppId> --project <id>   # proof: an oauth_client with client_type 1
```

Register every signing key: each build machine's debug key (FilesHub `GET /debug-keystores`), the release upload
key, and Play App Signing's key once it is on. Store the created id in FilesHub `google_cloud.oauth_android_client_id`
for the record, and refresh `android/app/google-services.json`.

## Stay on TypeScript 6

`cap sync` transpiles the config through the TypeScript JS API, which TS 7 removed. Pin `~6.0.3` — see
`aoneahsan-cccs-typescript`.

## The appId is permanent

Annotate it: a published identifier can never change without orphaning every user.

```ts
appId: 'com.zaions.ztools', // ⚠️ DO NOT CHANGE — published on Google Play
```

Convention: the domain reversed — `vessl.aoneahsan.com` → `com.aoneahsan.vessl`.

## Branch at the call site

`Capacitor.isNativePlatform()` where the decision is made, not buried inside a helper that silently falls
back. Share, review prompts, storage and auth all differ; a silent fallback is how a web user gets nothing
when they click Share.

## Safe areas: exactly one owner

Either the edge-to-edge plugin **with core `SystemBars` insets handling disabled**, or CSS
`env(safe-area-inset-*)` with `viewport-fit=cover` — never both, and never neither. Two owners means content
renders behind the system bars.

For config, plugin usage and the sync workflow, read `references/setup.md`.
