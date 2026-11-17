# Overview — `aoneahsan-cccs-nodejs`

## Purpose

Governs everything that runs outside the browser: build steps, CLI and release tooling, and the decision of
whether a backend may exist at all. Its most important job is the last one — the zero-cost rule is what keeps
~105 projects running without infrastructure bills.

## What this skill does

- Puts the **zero-cost pre-flight first**: a five-question check where any "no" rejects the design, plus the
  allowed/not-allowed backend table (Cloudflare Workers and FilesHub in, Firebase Functions and Firebase
  Storage out) and the shared-account naming rules for Workers and their secrets.
- Sets version management through `nvm`, including the never-`npm install -g npm` rule.
- Gives the **dependency-free `.env` loader** for plain Node processes, with both traps — `loadEnvFile` is
  first-wins so the most specific file goes first, and it throws on a missing file so it needs an
  `existsSync` guard — and connects it to the Capacitor ISSUE-003 failure.
- Restates the no-scripts rule and defines the one accepted exception: a build or release tool the build
  itself invokes, with the obligations that come with it (docblock, idempotent, loud failure, non-zero exit).
- Covers baseline Node practice: `node:` builtins, promise APIs, streaming, exit codes.

## When it gets invoked

- Writing a build step, a postbuild task, or a release tool.
- A feature appears to require a server, or someone proposes a backend.
- Choosing between backend options for a project.
- Loading environment variables in any process a bundler does not run.
- Setting up Node versions for a new project or a new machine.

## Where it applies

Every project with a build pipeline, and every decision about server-side capability.

## Sources

`_source-understanding/files/prompt-logs.md` (zero-cost constraint, Cloudflare Workers, FilesHub-for-
everything, the dotenv question the owner raised directly) and
`_source-understanding/projects/ztools-capacitor-android.md` (the shipped `process.loadEnvFile` fix and the
build-tool exception in practice).

## Related skills

`aoneahsan-cccs-javascript` (the language layer) · `aoneahsan-cccs-capacitor` (where the env-loading trap
bites hardest) · `aoneahsan-cccs-fileshub` and `aoneahsan-cccs-firebase` (the allowed services) ·
`aoneahsan-cccs-packages-up-to-date` (the tool hierarchy nvm sits at the top of).

## Maintenance

Re-check when the owner adds an approved service or changes the zero-cost boundary.
