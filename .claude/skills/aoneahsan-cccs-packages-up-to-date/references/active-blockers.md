# Active version blockers

The ecosystem-broken latest versions currently pinned fleet-wide, and the TS7-ready changes to make now.

**Active blocker:** `typescript` 7.0.x — the native Go port ships essentially no JS API, breaking
`typescript-eslint` (`yarn lint` dies) **and** `@capacitor/cli` (`cap sync` fails). Pin **`typescript ~6.0.3`**
until both support TS7. TS7-ready + harmless now: drop `baseUrl`, make `paths` relative, drop
`ignoreDeprecations`. A NEW such case → record it in that global ledger (never a project's docs) + a
`docs/VERSION-BLOCKERS.md` pointer.
