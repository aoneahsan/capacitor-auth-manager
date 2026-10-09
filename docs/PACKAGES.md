# Package inventory

Last Updated: 2026-10-09

| Dependency | Range | Purpose |
|---|---|---|
| `tslib` | `^2.8.1` | TypeScript runtime helpers |
| `@angular/common` | `^22.2.2` | Angular adapter templates/module dependency |
| `@angular/core` | `^22.2.2` | Angular adapter injection and decorators |
| `@angular/platform-browser` | `^22.2.2` | Required Angular router peer for build/smoke |
| `@angular/router` | `^22.2.2` | Angular route guards |
| `@capacitor/android` | `^8.5.3` | Native Android compile consumer |
| `@capacitor/cli` | `^8.5.3` | Native consumer setup and sync |
| `@capacitor/core` | `^8.5.3` | Plugin bridge; required runtime peer |
| `@capacitor/ios` | `^8.5.3` | Native iOS compile consumer |
| `@capacitor/preferences` | `^8.0.1` | Optional metadata storage peer |
| `@rollup/plugin-json` | `^6.1.0` | JSON import support |
| `@rollup/plugin-node-resolve` | `^16.0.3` | Bundled module resolution |
| `@trapezedev/configure` | `^7.1.10` | Required native configuration tooling |
| `@types/node` | `^26.6.4` | Build/test Node declarations |
| `@types/react` | `^19.3.0` | React adapter declarations |
| `eslint` | `^10.12.0` | Static lint checks |
| `prettier` | `^3.9.9` | Formatting |
| `react` | `^19.3.0` | Optional React adapter peer and smoke checks |
| `rimraf` | `^6.1.3` | Clean generated artifacts |
| `rollup` | `^4.64.3` | IIFE and CommonJS output |
| `rxjs` | `^7.8.2` | Angular observables; optional peer |
| `typescript` | `~6.0.3` | Compiler; pin ~6.0.3 because TS7 removes toolchain JS APIs |
| `typescript-eslint` | `^8.71.1` | ESLint TypeScript parser/rules |
| `vue` | `^3.5.43` | Optional Vue adapter peer |

## Native dependencies

Android uses Credential Manager 1.6.0, googleid 1.1.1, AppCompat 1.8.0, JDK 21, and SDK 36. The Gradle plugin stays on the Capacitor 8 template-compatible 8.13.0 line; moving independently to AGP 9 is not supported by that host template. Recheck when Capacitor's stable Android template adopts AGP 9. GoogleSignIn 10.x requires iOS 15. The package removed security-crypto: credentials remain in memory instead of using its deprecated encrypted-preferences API.

## Toolchain pin and temporary transitive fixes

TypeScript remains ~6.0.3: typescript-eslint still peers below 6.1 and Capacitor CLI needs the TypeScript JS API. Recheck TS7 after both support it; remove the pin after typecheck/lint/cap sync and consumer tests pass. No warnings are suppressed.

The latest plist 3.1.1 pins vulnerable xmldom 0.9.10; the scoped `plist/@xmldom/xmldom` resolution uses patched 0.9.12. The latest xcode 3.0.1 uses vulnerable uuid 7; the scoped `xcode/uuid` resolution uses the patched CommonJS-capable 11.1.1 release. These are development-tool dependencies, not this library's runtime dependencies. Recheck when either parent updates; remove each scoped resolution when the normal lockfile resolves a patched release and native/CLI smoke checks pass.

Runtime dependency is tslib only. Framework/Capacitor peers belong to the consuming application; its lockfile and security audit remain its responsibility. Trapeze's empty apps-config.yaml is intentional: this library has no application IDs or native application targets to rewrite. Consumer apps maintain their own platform configuration.

Googleid remains 1.1.1: 1.2.1 carries Kotlin 2.4 metadata which the current Capacitor 8 AGP 8.13 lint cannot parse. Debug compilation passed with 1.2.1, but minified release validation exposed the mismatch. Recheck when Capacitor adopts a compatible lint/R8 toolchain; update googleid after clean debug and minified-release builds without metadata errors. The stable pin is explicit; no lint suppression is used.
