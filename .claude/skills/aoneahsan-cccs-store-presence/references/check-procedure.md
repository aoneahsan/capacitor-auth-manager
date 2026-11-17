# Store presence — the check procedure

Last reviewed: 2026-09-17

## 1. Read the registry

```bash
REG=~/.claude/policy/store-developer-accounts.json
python3 -c "import json;[print(a['id'], a['developerPageUrl']) for a in json.load(open('$REG'))['accounts']]"
```

Registry fields, per account:

| Field | Meaning |
|---|---|
| `id` | Stable key, `<store>-<account>` (e.g. `google-play-zaions`) |
| `store` | `google-play` today; a new store gets its own value |
| `label` | Human name used in reports |
| `developerPageUrl` | The public page that lists every live app of the account |
| `listingUrlPattern` | How to build an app's listing URL from its id (`{applicationId}`) |
| `idPattern` | The regex that pulls ids out of the developer page |
| `userAgent` | The browser user agent the page answers normally to |
| `fetch` | The shell form of the read, for a quick manual check |
| `addedOn` | When the owner shared the account |
| `baseline` | The ids seen on `checkedOn`, so drift is visible at a glance |

`pending` holds stores the owner has mentioned but not shared yet. It is not an account and is never read.

## 2. Read each developer page

```bash
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
curl -sL --max-time 25 -A "$UA" 'https://play.google.com/store/apps/developer?id=Zaions&hl=en' \
  | grep -o 'details?id=[A-Za-z0-9._]*' | sort -u
```

A healthy read of the Zaions page is about 1 MB of HTML and lists every live app. **Zero ids means the read
failed** (consent page, rate limit, network), not that nothing is live. Then:

- Retry once with `&gl=US` appended.
- Use the browser tooling (`~/.claude/rules/browser-automation.md`): open the developer page, scroll to the
  end, and collect the `details?id=` hrefs from the DOM.
- Still nothing → report **unknown** for every app on that account and change no record.

## 3. Read the project's id

| Stack | Where the id lives |
|---|---|
| Capacitor | `android/app/build.gradle` → `applicationId` (a Trapeze project also has it in `apps-config.yaml`) |
| Flutter | `android/app/build.gradle(.kts)` → `applicationId` |
| React Native | `android/app/build.gradle` → `applicationId` |
| Tauri (Android) | `src-tauri/tauri.conf.json` → `identifier` |
| Bare native | the app module's `build.gradle` → `applicationId` |

```bash
grep -m1 -E 'applicationId' android/app/build.gradle
```

A browser extension or a web-only product has no Android id; its store presence (Chrome Web Store, Edge,
Firefox) is checked on that store's own listing page until a developer page for it is added to the registry.

## 4. Decide

```bash
ID=com.aoneahsan.lifewell
curl -sL --max-time 25 -A "$UA" 'https://play.google.com/store/apps/developer?id=Zaions&hl=en' \
  | grep -q "details?id=$ID\b" && echo "live: https://play.google.com/store/apps/details?id=$ID" || echo "not listed"
```

An app published under a **client's** developer account (Perkforce's `com.perkforce.app`, for example) is
not on the owner's page. For those, the listing page answering 200 with the app's own name is the proof,
and the record says whose account it is.

## 5. Record

Links block format for project guides (from `project-live-urls.json` → `agentRules.linksBlockFormat`):

```markdown
## Links
- Live: <liveUrl>
- Play Store: https://play.google.com/store/apps/details?id=<applicationId>
- Docs: <docsUrl>
```

Omit the Play Store line when the app is not listed. In `project-live-urls.json` set `playStoreUrl` to the
listing URL, or to `""` when not live. In the career-docs repo, `uv run cvgen stores` prints the verdict for
every CV project and `uv run cvgen stores --fix` writes or removes the `Google Play` link in the fact files;
`uv run cvgen check` fails when a printed link and the pages disagree.

## 6. Baseline — 2026-09-17, account `google-play-zaions`

13 ids: `com.aoneahsan.a1notebook` · `com.aoneahsan.achat` · `com.aoneahsan.app` ·
`com.aoneahsan.clearhire` · `com.aoneahsan.lifewell` · `com.aoneahsan.pregnancypal` ·
`com.aoneahsan.smsapp` · `com.trizlink.app` · `com.zaions.app` · `com.zaions.reflectify` ·
`com.zaions.scangenerateqrcodes` · `com.zaions.zaionslisting` · `com.zaions.ztools`.

Not listed that day, although older records carried Play links for them: `com.aoneahsan.habitforge`
(internal testing), `com.aoneahsan.labflow`, `com.zaions.labflow`, `com.aoneahsan.nativeupdate`,
`com.zaions.fileshub`, `com.aoneahsan.vcpeai`, `com.aoneahsan.achatachat` (a registry typo for
`com.aoneahsan.achat`).

## 7. Growing the registry

When the owner shares a new developer account or a new store:

1. Add an entry to `accounts` with every field in §1 (`id`, `store`, `label`, `developerPageUrl`,
   `listingUrlPattern`, `idPattern`, `userAgent`, `fetch`, `addedOn`, `baseline`). For a store whose
   listing URLs are not built from an id, write the pattern the store actually uses and say so in `note`.
2. Read the page once (§2) and store the ids in `baseline` with today's date.
3. Remove the matching `pending` note; bump `version` and `lastUpdated`.
4. Re-run the check for every project and update the records it changes (§5).
5. Commit the registry in the notebook repo by explicit path.
