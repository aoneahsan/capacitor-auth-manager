# Project audit checklist

## Storage

```bash
grep -rn "localStorage\|sessionStorage" src/ --include="*.ts" --include="*.tsx"   # expect zero
grep -rn "@capacitor/preferences" src/                                            # expect zero in new projects
```

All storage flows through one adapter:

```ts
// src/lib/storage.ts — the ONLY module that imports the storage package
import { Strata } from 'strata-storage';

export const storage = new Strata({ namespace: 'myapp' });

export const get = <T>(k: string) => storage.get<T>(k);
export const set = <T>(k: string, v: T) => storage.set(k, v);
export const remove = (k: string) => storage.remove(k);
```

## Package inventory

```bash
python3 -c "
import json; d=json.load(open('package.json'))
deps={**d.get('dependencies',{}),**d.get('devDependencies',{})}
for k in sorted(deps):
    if any(s in k for s in ('capacitor','capawesome','codetrix','onesignal','strata','native-update','ionic')):
        print(f'  {k}: {deps[k]}')"
```

Cross-check each entry against something in `src/` that uses it. An installed plugin nobody imports is dead
weight that may still inject a permission.

## Banned packages

```bash
grep -rE "@capacitor-firebase/(crashlytics|performance)" package.json   # must be empty
```

## `@ionic/pwa-elements`

```ts
// main.tsx
import { defineCustomElements } from '@ionic/pwa-elements/loader';
defineCustomElements(window);
```

Without this, `Camera.getPhoto()`, `Toast.show()` and `Dialog.confirm()` do nothing in a browser — no error,
just silence. Easy to miss because native testing passes.

## Edge-to-edge decision

```bash
grep -n "edge-to-edge" package.json
grep -n "insetsHandling" capacitor.config.ts
grep -rn "safe-area-inset" src/
```

| Plugin present | `insetsHandling: 'disable'` | Verdict |
|---|---|---|
| yes | yes | ✅ correct |
| yes | no | ❌ two owners — content behind the bars |
| no | n/a | ✅ **only if** `env(safe-area-inset-*)` + `viewport-fit=cover` are present |
| no | n/a, and no CSS insets | ❌ no owner — content behind the bars |

**Also check `android.includePlugins`.** If that key exists in `capacitor.config.ts`, it is a strict
allowlist — a plugin missing from it is inert natively, so "adding the plugin" changes nothing and the fix
appears not to work.

## Merged manifest

```bash
# after a release build
find android -path "*merged_manifests*" -name "AndroidManifest.xml" | head -1
grep -E "uses-permission|uses-feature" <that file>
```

The **merged** manifest is the truth — plugins inject permissions the source manifest never mentions. Strip
anything unused:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" tools:node="remove" />
```

## Google Sign-In wiring

```bash
grep -n "serverClientId" capacitor.config.ts
npx cap sync android && grep -A4 '"GoogleAuth"' android/app/src/main/assets/capacitor.config.json
ls android/app/google-services.json
```

The generated JSON must show the **real** client id — an empty string here means the env loader is missing or
mis-ordered (`aoneahsan-cccs-capacitor`).

## iOS platform

The owner has no Apple Developer account, so iOS is removed from owned projects until that changes:

```bash
grep -n "@capacitor/ios" package.json          # should be absent
ls ios 2>/dev/null                              # should not exist
grep -n "mobile:ios\|cap:.*ios" package.json    # scripts should be gone
grep -n "ios:" capacitor.config.ts apps-config.yaml 2>/dev/null
```

Removal is a four-part job — dependency, folder, scripts, config blocks — and ztools currently has the folder
gone but the rest remaining, which is the usual half-done state.

## Final gates

```bash
yarn typecheck && yarn lint && yarn build
npx cap sync android
npx cap ls                                      # parses, Android only
```
