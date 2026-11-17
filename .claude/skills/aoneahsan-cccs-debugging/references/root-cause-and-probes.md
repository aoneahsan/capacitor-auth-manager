# Root-cause investigation + live-probe recipes

## The four phases in full

### Phase 1 — Root-cause investigation (before ANY fix)

1. **Read the error completely.** Full message, full stack trace, line numbers, file paths, error codes.
   The exact fix is often named in the text you skimmed past.
2. **Reproduce consistently.** Exact steps; every time or intermittent? No reliable repro → gather more
   data, do not guess.
3. **Check recent changes.** `git diff`, recent commits, new dependencies, config or environment changes.
4. **Instrument boundaries in a multi-component system.** Before proposing a fix, log what enters and exits
   each component (CI → build → sign; app → service → database → rules). Run once; the evidence shows which
   boundary breaks. Investigate only that component.
5. **Trace the data flow backward.** Where does the bad value originate? What passed it in? Keep going up
   until you reach the source. Fix there, not where the error surfaced.

### Phase 2 — Pattern analysis
- Find similar code in the same repo that works. What's different?
- If following a reference implementation, read it completely — every line — before applying it.

### Phase 3 — Hypothesis
- State the specific root cause and the single minimal change that should fix it, and why that change
  addresses the cause (not the symptom).

### Phase 4 — Fix at the source, then verify
- Implement the minimal fix. Verify against the **original** symptom with fresh evidence
  (`aoneahsan-cccs-verification`). If it still fails, return to Phase 1 — the hypothesis was wrong.

## The live-probe method (owner-proven)

A rule or permission failure is diagnosed by **probing the live system**, never by reading the rule and
reasoning about it. Issue the exact request twice — once as the app sends it, once with a single variable
changed — and compare status codes. **403 vs 200 is the whole test.**

### Firestore rules / data-fetch (from `~/.claude/rules/data-fetch-budget.md`, `services-integrations.md`)

- **A list/count/aggregation must filter on the field its RULE reads.** A rule that reads
  `resource.data.ownerUid` requires `where('ownerUid','==',uid)` on every such query, even on a subcollection
  the caller owns. Prove it: issue the `structuredQuery` as a **non-admin**, once as the app sends it and
  once with the extra filter — 403 vs 200.
- **Verify as a NON-ADMIN.** An admin account passes `isModOrAdmin()`-style gates, so the rules bug is
  invisible; whole modules can be broken for real users while the matrix reads PASS.
- **Seed data first — a `(200, 0)` probe proves nothing.** A query returning zero documents passes the rules
  check vacuously (no document to fail it). Seed a matching row, then probe.
- **`sum()`/`average()` need the aggregated field in the composite index** (not just the filtered fields);
  `count()` does not.

### FilesHub / origin-restricted keys (from `~/.claude/rules/fileshub-api.md`)

- **Probe both directions.** A junk origin must 403 *and* each real origin (exact scheme+port the browser
  sends, e.g. `http://localhost:5991`) must 200. Passing only the first hides a port/scheme mismatch.
- **Probe with `Origin` only.** Sending `X-App-Id` on a restricted key can be the rejected identity even when
  the origin is allowed — it 403s every origin and reads as a totally broken allowlist. Read the error: it
  names which check failed (`Rejected: App: …` vs `Rejected: Origin: …`).
- **A fire-and-forget send hides its own failure.** `void sendEmail(...)` swallows a 403 by design, so the
  feature looks implemented while every send silently fails in production. A green build and a code read both
  lie — only an actual live call proves it. Grep for the pattern (`grep -rn "X-App-Id" src/`) rather than
  assuming.

### The general rule

A green typecheck/lint/build proves the code compiles — nothing about runtime behavior, security rules, or
calls whose result is discarded. When the failure surfaces only as an error state (a TanStack Query error, a
swallowed promise) with nothing in the console, static gates cannot catch it. Run the app as a real,
non-admin user, or issue the live request yourself.
