# Capacitor setup

## Config with the env loader

```ts
import type { CapacitorConfig } from '@capacitor/cli';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Load .env for the Capacitor CLI.
 *
 * The CLI transpiles this file to CommonJS and requires it in a plain Node process, so
 * process.env exists but nothing populates it — loading .env is Vite's job, and Vite never
 * runs during `cap sync`. Without this, VITE_* reads below are undefined and silently ship
 * as "" in the generated native config. (import.meta.env does not exist here at all — it is
 * a Vite transform, not a runtime API.)
 *
 * process.loadEnvFile is built into Node >= 20.12 — no dotenv dependency needed. It does NOT
 * overwrite an already-set key, so the FIRST file wins: .env.local before .env reproduces
 * Vite's precedence, and real shell/CI vars still beat both. existsSync guards its ENOENT throw.
 *
 * Fleet record: ~/.claude/rules/capacitor-plugins-and-issues.md → ISSUE-003.
 */
for (const envFile of ['.env.local', '.env']) {
  const envPath = resolve(__dirname, envFile);
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

const serverClientId = process.env.VITE_GOOGLE_WEB_CLIENT_ID;
if (!serverClientId) {
  throw new Error('VITE_GOOGLE_WEB_CLIENT_ID is missing — Google Sign-In will not work on device.');
}

const config: CapacitorConfig = {
  appId: 'com.zaions.ztools',   // ⚠️ DO NOT CHANGE — published on Google Play
  appName: 'ZTools',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,        // the app decides when it is ready
      launchFadeOutDuration: 300,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    Preferences: { group: 'com.zaions.ztools.prefs' },
    GoogleAuth: { scopes: ['profile', 'email'], serverClientId },
  },
};

export default config;
```

Keeping the whole docblock is deliberate — the next person to edit this file needs the reasoning, not just
the loop.

## Sync workflow

Install Trapeze in every Capacitor project and keep a root `apps-config.yaml` for the active native
platforms. The script name and command are a fleet contract, not a project preference.

```json
{
  "scripts": {
    "sync:apps-config": "trapeze run apps-config.yaml",
    "cap:sync": "cap sync android",
    "cap:open:android": "cap open android",
    "android:build:debug": "cd android && ./gradlew assembleDebug",
    "android:bundle:release": "cd android && ./gradlew bundleRelease"
  }
}
```

These are the fleet's standard names: `aoneahsan-cccs-packages-up-to-date/references/baseline.md` §4. A
project with variant names (`mobile:sync`, `cap:android`, `config:apply`) renames them. `cap:sync` does not
build: run `yarn build` first, because the web bundle must exist before it is copied.

Run `yarn sync:apps-config` before `cap sync` or a native build whenever a managed value changes. If Gradle
uses guarded variables, target those variables in `apps-config.yaml`; do not let Trapeze replace the guarded
`defaultConfig` expression with a literal. A project without iOS keeps the YAML Android-only.

`cap sync` copies the web build **and** updates native dependencies; `cap copy` only copies web assets. After
adding or removing a plugin you need `sync`, not `copy`.

Never run `cap run` — it starts a device build, which is owner-only.

## Verifying the generated config

```bash
npx cap sync android
cat android/app/src/main/assets/capacitor.config.json | python3 -m json.tool | head -40
```

Assert the **resolved value**, not that the key exists. `KEY=` with an empty value in `.env` looks configured
to a grep and resolves to an empty string.

## Platform branching

```ts
import { Capacitor } from '@capacitor/core';

export async function shareContent(payload: SharePayload) {
  if (!Capacitor.isNativePlatform()) {
    openWebShareModal(payload);        // explicit web path — see aoneahsan-cccs-react-ui-ux
    return;
  }
  const { Share } = await import('@capacitor/share');
  try {
    await Share.share(payload);
  } catch (error) {
    if ((error as Error).name === 'AbortError') return;   // user cancelled — not an error
    logger.error('Native share failed', error);
  }
}
```

The dynamic import keeps the native plugin out of the web bundle.

## Safe areas — the two valid branches

**With the edge-to-edge plugin:**

```ts
plugins: {
  SystemBars: { insetsHandling: 'disable' },   // required, or two owners fight
  EdgeToEdge: { backgroundColor: '#ffffff' },
  StatusBar: { style: 'LIGHT', overlaysWebView: true },  // icon contrast only
}
```

Core `SystemBars` defaults to `insetsHandling: 'css'`, which pads the WebView's parent and **zeroes the
insets the child receives** — collapsing the plugin's margins so content fills behind the bars. Disabling it
leaves one owner.

**Without the plugin (CSS branch):**

```html
<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0">
```
```css
#root { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
```

Valid precisely because there is no second owner. Adding the plugin later without setting
`insetsHandling: 'disable'` breaks it.

## Android Studio and devices are owner-only

Signed builds, `cap run`, emulators and device testing are all owner tasks — record them in
`docs/MANUAL-TASKS.md`.
