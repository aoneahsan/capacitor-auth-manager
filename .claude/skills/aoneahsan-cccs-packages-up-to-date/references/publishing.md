# Publishing npm packages — the standing authorization and its gate

**Finish work on an npm package → publish it. Automatically, without asking.** (Owner directive
2026-07-25.) The owner should never again have to run `npm publish` by hand or be asked whether to.

The gate below is the price of that automation. Run it in order; **any failure is a hard stop**, not a
warning you note and publish anyway.

## Scope

| Case | Action |
|---|---|
| New version of an **already-published** package | ✅ Publish automatically |
| **First-ever** publish of a brand-new package | 🛑 **ASK.** It creates a permanent public surface and squats a name. Detect it: `npm view <pkg> version` returns 404 / no versions |
| **Major** version (breaking) | ✅ Publish, but the report must say **MAJOR** prominently and name what broke compatibility |
| Client-owned repos | ❌ Never |

Otherwise scope follows the auto-commit rule — packages under `code/`.

The token already lives in `~/.npmrc`, so `npm publish` just works. If it does not, repopulate it from the
secrets store **without echoing it**, in the same shell invocation as the publish (a separate sandboxed call
may not persist the write → `ENEEDAUTH`):

```bash
npm config set //registry.npmjs.org/:_authToken "$(cat ~/.secrets/npm/registry.npmjs.org.token)"
```

---

## The gate

### 1. Clean tree, pushed
`git status --porcelain` empty **and** `git rev-list --left-right --count HEAD...<remote>/main` = `0 0`.
The published artifact must correspond to a commit that actually exists on the remote. The remote is `o`, never
`origin` (`~/.claude/rules/git-workflow.md`).

### 2. Gates green
`yarn typecheck && yarn lint && yarn build` — all exit 0. Build from the clean tree, not a stale `dist/`.

### 3. Version strictly greater than the registry — and the README is release content
`package.json` version > `npm view <pkg> version`. Never republish an existing version. Also confirm the
changelog has an entry for it and version strings inside README / guides are current.

**The README ships inside the tarball, so npmjs.com only ever shows the README of the last publish.** Before
shipping, confirm it still matches the house pattern (`aoneahsan-cccs-npm-package-readme`):

```bash
grep -oE '<a id="[^"]+"' README.md | sort | uniq -d          # duplicate anchor ids — must be empty
grep -oE '\]\(\.\.?/' README.md                              # relative links — dead on npmjs.com, must be empty
grep -oE '\]\(https?://[^)]+\)' README.md | sed 's/.*(\(.*\))/\1/' | sort -u \
  | while read -r u; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' -m 8 "$u")" "$u"; done
```

Every URL returns 200/301, every TOC entry matches a heading, and the at-a-glance version equals the version
being published. A relative link is the quiet one — it works on GitHub, so it looks fine right up until the
package page renders it off-repo.

**🔴 Then grep the PACKED tarball for the previous version string. It must come back empty.**

```bash
PREV=$(npm view <pkg> version)                     # what is on the registry right now
npm pack --silent >/dev/null && tar -xzOf <pkg>-<new>.tgz --exclude='*CHANGELOG*' 2>/dev/null \
  | grep -c "$PREV"                                # must be 0
```

This one command caught **eight of twelve publishes in a single fleet pass** (2026-07-25). The at-a-glance
`| **Version** | x.y.z |` row is a *static duplicate* of `package.json.version`, so it goes stale the instant
you bump — and a README written before the bump then ships announcing the version it replaced. The changelog
is excluded because it legitimately names every prior version.

**Bump and README-sync are one operation, never two.** For a Capacitor plugin the cascade also reaches
`*.podspec` `s.version` and `android/build.gradle` `versionName`; for a shell CLI it reaches the script's own
`*_VERSION=` fallback and any generated bundle, which must be rebuilt. A partial bump means the installed tool
misreports itself — the fleet pass shipped `sysscope@1.0.2` that way and needed an immediate 1.0.3.

### 4. 🔴 Content-regression diff — the check that exists because of a real incident
Pack the candidate and the published latest, extract both, compare:

```bash
npm pack --pack-destination /tmp/cand
npm pack <pkg>@latest --pack-destination /tmp/prev
diff -rq /tmp/prev/package /tmp/cand/package
comm -23 <(cd /tmp/prev/package && find . -type f | sort) \
         <(cd /tmp/cand/package && find . -type f | sort)   # files LOST — must be empty
```

**Any file that disappears, or shrinks materially, is a STOP** unless the removal is deliberate and named in
the changelog. Compare byte sizes of README, the AI guide, and `dist/` entry files explicitly.

**Why this step exists — `strata-storage@2.8.2`, 2026-06-30.** It was published from a stale working tree
55 minutes after 2.8.1 and never committed or tagged. Its compiled output was byte-identical to 2.8.1, so it
**passed typecheck, lint, build and install**. What it did was silently *lose* documentation: the required
`npx cap sync` native-setup step and the `registerCapacitorAdapters()` helper were gone from `README.md` and
`AI-INTEGRATION-GUIDE.md`, so every consumer's native adapters failed on device with no error pointing at
the cause. It sat as `latest` for 25 days. **No conventional gate looks for content loss — only this one
does.** Steps 1 and 4 each independently would have caught it.

### 5. Secret sweep of the tarball
A published tarball is public forever and unpublishing is not a real remedy. Over the **extracted candidate**:

```bash
find . -type f | grep -iE '\.env$|\.env\.|secret|credential|serviceaccount|\.pem$|\.jks$|\.keystore$|\.p8$|npmrc'
grep -rlE "npm_[A-Za-z0-9]{30,}|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY|AIza[0-9A-Za-z_-]{30,}" .
```

Both empty. Check the `files` field really excludes internal docs, `CLAUDE.md` / `AGENTS.md`, and records.

### 6. Smoke-install every declared entry point
A repo build proves nothing about the `exports` map. Install the **packed tarball** into a temp dir and
verify each subpath target exists, then import the main entry for real:

```bash
mkdir /tmp/smoke && cd /tmp/smoke && npm init -y && npm i /tmp/cand/*.tgz
node -e "const p=require('strata-storage');/* instantiate something real */"
```

Walk `pkg.exports` and assert every `types`/`import`/`require` target resolves on disk. A missing `dist/`
file or a typo'd subpath is invisible until a consumer hits it.

**🔴 Existing is not loading. Asserting a path exists is the weak half of this check** — the 2026-07-25 fleet
pass shipped **three** packages whose entry points all resolved on disk and none of which could be loaded:

```bash
node -e            "const m=require('<pkg>'); console.log(Object.keys(m).length)"   # 0 = broken
node --input-type=module -e "const m=await import('<pkg>'); console.log(Object.keys(m).length)"
[ -n "$BIN" ] && node "$(node -p "require('<pkg>/package.json').bin|>Object.values(_)[0]")" --help
```

Three failure shapes, each green through typecheck, lint, build **and** the exports walk:

- **A CommonJS artifact named `*.cjs.js` inside a `"type": "module"` package.** Node judges module format by
  the final extension, so it loads CJS as ESM and `require()` silently returns `{}` — no error. Hit
  `native-update` and `capacitor-biometric-authentication`. The artifact must end in `.cjs`.
- **Extensionless relative specifiers in emitted ESM.** `moduleResolution: "bundler"` lets `tsc` emit imports
  Node's ESM resolver rejects outright. `NodeNext` makes the compiler enforce it.
- **A `bin` that is never executed.** `unified-tracking`'s CLI had never run in *any* 3.x release — a CJS
  `.js` file dying on its first line. Resolving the path proved nothing; running it took one second.

Also worth compiling: extract the README's TypeScript examples and `tsc --strict --noEmit` them against the
**installed** tarball. That caught a config-shape error four careful readings had missed.

### 7. Publish, then verify **from the registry**
```bash
npm publish
npm view <pkg> version            # must equal the version you shipped
```
Then re-run the smoke install against the **published** package (not the local tarball), and grep the
installed files for whatever step 4 was protecting. Verifying the local artifact is not verifying the
release.

---

## After publishing

Keep every surface consistent in the same pass — a version bump that lands in only some places is its own
recurring failure (`~/.claude/rules/publishing-compliance.md` → Version Update Checklist): the manifest,
version constants, `docs/play-store/RELEASE-NOTES.md` or the changelog, the website changelog, and any
in-app update notice. For a package with a docs site, sync the docs site too.

Report honestly: the version, whether it was a major, what the content diff showed, and anything the gate
flagged that you judged intentional — with the reason.

---

## When a release turns out to be bad — deprecate it

The gate stops a bad release going out. It does nothing about one already **out there**. Publishing a fix
moves `latest`, but everyone pinned to the bad version, and anyone who installs it deliberately, still gets
it. **Deprecating is the only thing that reaches those people**, and it is reversible — so a released
version found to be broken gets deprecated, automatically, under the same authorization as publish.

```bash
npm deprecate <pkg>@<exact-version> --dry-run "<message>"   # confirm it matches ONE version
npm deprecate <pkg>@<exact-version> "<message>"
npm view <pkg>@<exact-version> deprecated                   # took?
npm view <pkg>@<good-neighbour> deprecated                  # MUST be empty — proves no over-reach
```

**Five constraints, each guarding a real footgun:**

1. **🔴 Always pin the exact version.** `npm deprecate <pkg> "msg"` with **no version deprecates every
   version of the package**, and a range like `<2.8.3` sweeps up perfectly good releases. `--dry-run` first,
   then verify a known-good neighbour is still clean.
2. **Only after the fix is published AND verified from the registry.** The message tells people where to go;
   that version has to exist first. Fix → publish → verify → deprecate.
3. **🔴 Never `npm unpublish`.** It breaks every existing dependent and every lockfile pointing at it.
   Deprecation warns without breaking anyone. Unpublishing is not the stronger version of deprecating.
4. **The message states the fault AND the remedy.** It is all the developer sees, at install time, out of
   context: what is wrong, what to use instead. No blame, no internal jargon.
5. **It is reversible** — `npm deprecate <pkg>@<v> ""` clears it. That is what makes deprecating on
   reasonable suspicion correct rather than risky.

**What triggers it:** running the step-4 content diff against an already-published version · a consumer bug
traced to a specific version · a published tarball that does not match the repo at its tag · a security issue.

Record the reason in that version's `CHANGELOG.md` entry too, so it survives outside the registry.

**Worked example — `strata-storage@2.8.2`, deprecated 2026-07-25:**

> Published in error - the bundled docs omit the required 'npx cap sync' step, so Capacitor native adapters
> fail silently on device. Code is identical to 2.8.1. Please upgrade to 2.8.3 or later.

Verified after: 2.8.2 carries the notice, **2.8.1 / 2.8.0 / 2.8.3 stayed clean**, `latest` stayed 2.8.3, and
a real `npm i strata-storage@2.8.2` prints the warning while 2.8.3 installs silently.

## Why the content-regression step exists (moved from SKILL.md)

That fourth step exists because `strata-storage@2.8.2` passed every other check while silently dropping
required setup docs. And a release later **found** broken gets **deprecated** — exact version only, after
the fix ships, never `npm unpublish`. Both: `references/publishing.md`.

## Measured on windowsweep, 2026-11-07

- 🔴 **`VERSION` can ship with CRLF.** A merge on a Windows checkout (`core.autocrlf=true`) rewrote `VERSION` with CRLF and
  `npm pack` packed it so; the published 1.4.3 had LF. Pin it in `.gitattributes` (`VERSION text eol=lf`) and check
  `od -c` on the packed file. Compare packed files with `HEAD` with CR stripped: autocrlf makes a byte compare report every
  `.ps1` as different when only the line ends differ. Publish the gated `.tgz` itself (`npm publish ./x.tgz`).
