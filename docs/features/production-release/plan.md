# Production Google sign-in release

Last Updated: 2026-10-09

## Scope and paths
Audit the Google-only package for React/Firebase on web, Android, iOS. Restore the checkout at its recorded path, independently of the docs/root repositories. Implement in src/core/auth-manager.ts, src/core/provider-registry.ts, src/providers/web/google-provider.ts and related storage/native/adapters only where evidence requires it. Update package.json, yarn.lock, scripts, tests, native dependency manifests, README.md, CHANGELOG.md, and AI-INTEGRATION-GUIDE.md. Synchronize the independent Docusaurus docs repository after npm release.

## Contracts and security
Preserve root/core/react/vue/angular/providers-web exports, lazy auth access, sideEffects:false, Google-only enablement and Firebase-agnostic credentials. Web auto can return an ID token or access token; Firebase must accept either. Tokens must not enter default JS storage or logs. Verify issuer/audience/nonce/expiry locally without claiming signature verification; Firebase/server owns verification and authorization. Configure once, coalesce provider initialization, settle duplicate/cancelled flows and prevent stale restore after sign-out. Use supported SDK APIs, never hide warnings or add compatibility shims. Add mandatory @trapezedev/configure/apps-config.yaml/sync:apps-config tooling without writing app IDs or credentials into the library. No database/schema migrations. Node floor changes from published >=18 to >=24 require a major release, even though the unpublished branch says 2.5.0.

## Dependency rollout
Read known-blocker ledger. Update direct JS dependencies to latest stable; pin TypeScript ~6.0.3 while TS7 is ecosystem-incompatible. Verify native stable release APIs before migrating. Fix all missing peer declarations and build fallout. Record purposes and blocker re-check/removal in docs/PACKAGES.md. Use Yarn for all local installs/scripts, secret-free configuration, no billing actions.

## Verification
Run yarn install --immutable; yarn typecheck; yarn tsc -b tsconfig.build.json --force; yarn lint; yarn build; yarn test; yarn smoke:tarball; yarn npm audit --recursive. Pack and inspect exact allowlisted tarball for secrets, maps, disabled providers and internal files. Install in fresh Yarn consumer; actually import every ESM/CJS subpath, compile React/Firebase README/AI-guide examples and browser bundle. Test mocked GIS ID and popup success, cancellation, popup block, expired/invalid nonce/audience/issuer, duplicate sign-in, storage denial, session restore/sign-out races, initialization failures and no persisted tokens. Compile clean Android consumer with Capacitor 8 and current SDK; macOS Xcode and real browser/Android/iOS Google sign-in remain explicit manual gates when unavailable on this Linux host. Docs: yarn typecheck and yarn build, raw manifest/version checks, curl live pages/llms/raw HTTPS.

## Success, ordering and rollback
Review full diff against this plan and fix findings before committing. Fetch/merge each remote before editing and again before commit/push, no force or PR. Push package main and await clean CI; publish unused semver version only after artifact verification and documentation approval/exception. Verify registry install/version, report package readiness with test limitations immediately; then push docs main and verify Pages deployment/URLs. Keep project-root isolated. If a release regression occurs restore previous npm latest tag, publish fix, deprecate exact broken release only after fix verified; never unpublish. Revert docs through Git.

## Unresolved environment gates
Technical-only documentation exception requested because no Story Bible exists. No Android devices attached; no macOS/Xcode on host. Report unavailable runtime verification honestly, never certify the target app without its OAuth setup/device evidence. npm authentication/2FA may require owner input after the release is concrete and reviewable.

## Execution decisions

Owner approved the technical-only documentation exception in this session. Release is 3.0.0 because Node/iOS floors and Angular peer ranges change. CommonJS root/adapters share the core singleton; providers/web has a dedicated CommonJS artifact. ESM output has an explicit package type boundary. The CLI is Google-only, supports help/dry-run, rejects non-interactive use, and never overwrites files. Linux Android consumer compiled; macOS CI checks the iOS artifact. Real OAuth sign-in remains a consuming-app runtime check.

## Verification and diff review

Full diff reviewed against the scope/security/export/rollout plan. Found and fixed CJS singleton separation, missing native pack contents, nonce absence, token expiry/subject validation, unbounded waits, popup disposal, and stale session restoration. Local Node 24/26 checks pass: forced compiler build, lint, 30 regression tests, every packed ESM/CJS entry, React SSR configured state, complete AI-guide TS examples and browser bundle. Android Capacitor 8 consumer assembleDebug passed with SDK 36/JDK 21. Exact npm dry-run artifact includes native sources and excludes disabled providers/internal files/maps. Package recursive all-dependency audit has no advisories. Trapeze dry run exits successfully with no operations; the library layout has no Android application manifest, which its loader reports. No app IDs are invented. Docs strict anchors/links and typecheck/build pass; one unpatched build-only braces advisory is recorded in docs inventory. iOS native CI and live registry/Pages verification follow the push. Real OAuth/browser/device tests remain unperformed on this host.

Remote ISSUE-006 arrived during execution and was merged without losing its instructions. Added a packed INTERNET-only permission assertion and consumer ProGuard rules for reflected Capacitor entry points. Android smoke now builds both debug and a minified release; review/testing includes this release requirement.

The minified Android check exposed googleid 1.2.1 Kotlin metadata incompatibility with the Capacitor 8 template lint. Keep supported googleid 1.1.1 with a recorded recheck gate. Modernized own Gradle DSL assignments, removed inherited abortOnError suppression, and separated native profile metadata from memory-only credentials to preserve configured cold-start behavior.

Final local Android debug and R8-minified release both passed (281 Gradle tasks) with googleid 1.1.1 and no package deprecation/Kotlin metadata errors. Root coordination now ignores and records the owner-cloned independent package checkout; it will be fast-forwarded to the pushed release without moving either checkout.

First CI run failed before install: setup-node v5 automatically invoked runner Yarn 1 for caching before Corepack. Use its supported package-manager-cache:false setting; Corepack then activates the pinned Yarn 4. No checks are skipped.

## Completed release

3.0.0 published and verified as npm latest; downloaded artifact contains only INTERNET permission and all native sources. Fresh registry consumer smoke passed. Release CI: https://github.com/aoneahsan/capacitor-auth-manager/actions/runs/37927572869 (all four jobs successful). GitHub release/tag 3.0.0 points to the verified source. Docs Pages deploy 37928133178 succeeded; HTTPS homepage, integration/ai, llms.txt, llms-full.txt, raw/manifest.json and raw/integration/ai.md return 200 and version 3.0.0 (35 raw pages). ISSUE-006 moved to resolved history only after publication verification. The newly cloned owner checkout is synchronized. No real OAuth/device sign-in was performed; production app acceptance remains mandatory. Docs tooling retains the explicitly recorded unpatched braces advisory. Direct pushes used the configured admin bypass for the PR requirement; protections were not changed.
