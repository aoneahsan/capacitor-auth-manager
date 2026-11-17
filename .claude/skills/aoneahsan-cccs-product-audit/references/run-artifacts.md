# Run records — layout and formats

## Where

`~/Documents/01-code/projects-finalization-record/product-audits/<project>/<YYYY-MM-DD-HHMM>/` (private repo
`aoneahsan/projects-finalization-record`, owner decision 2026-10-26). `<project>` is the slug used in
`production/` there (e.g. `lifewell`). A CLIENT project uses the client's owner-controlled folder instead
(`client-projects.md`). 🔴 Every run is a new folder. Resume names the old folder; never overwrite it.

## Files

| File | Written by | Holds |
|---|---|---|
| `MANIFEST.md` | main | target origins, repos + HEAD per repo, dirty files left alone, environments, roles/accounts by alias, data inventory (DATA-01), integrations by name, budgets, missing access |
| `coverage.md` | main | one table row per check ID: `id · lane · applicable(Y/NA) · status · evidence · reason/next` |
| `lane-security.md` · `lane-experience.md` · `lane-discoverability.md` | the lane agent (or main) | the lane's raw results in the same row format + findings in prose |
| `findings.json` | main | the integrated findings (schema below) |
| `fix-ledger.md` | main | `finding · files · before evidence · change · gates · after evidence · state · commit · rollback` |
| `evidence/` | all | sanitized outputs: Lighthouse/axe JSON, screenshots, curl transcripts. No secrets or real data |
| `REPORT.md` | main | the owner-facing report (below) |
| `RESUME.md` | main | revision per repo, completed check IDs, open findings, owner answers, the exact next step |

## `findings.json`

```json
{
  "run_id": "lifewell-2026-10-27-0915",
  "project": "lifewell",
  "revisions": { "lifewell": "abc1234", "project-root": "def5678" },
  "findings": [
    {
      "id": "F-SEC-001",
      "check_ids": ["ACCESS-02"],
      "vendor_ids": [],
      "title": "RPC get_x executable by anon",
      "status": "FAIL",
      "priority": "P0",
      "severity": "high",
      "confidence": "high",
      "provenance": "live read-only catalog query",
      "environment": "supabase dev ref",
      "observed_at": "2026-10-27T09:31:00Z",
      "surface": "supabase/migrations/0042_x.sql:12",
      "expected": "EXECUTE granted to authenticated only",
      "actual": "anon holds EXECUTE via pg_default_acl",
      "evidence": ["evidence/acl-functions.txt"],
      "fix": "revoke from public and anon by name, grant to authenticated; forward-only migration",
      "acceptance_test": "routine_privileges shows no anon row; anon RPC call returns 401/permission denied",
      "rollback": "re-grant statement in the migration notes",
      "owner_action_required": false,
      "fix_state": "live-verified",
      "after": { "observed_at": "2026-10-27T11:02:00Z", "revision": "aaa9999", "result": "PASS", "evidence": ["evidence/acl-functions-after.txt"] }
    }
  ]
}
```

`fix_state` ∈ `not-started · planned · implemented-local · gates-green · verified-local · deployed ·
live-verified · blocked` (`evidence-and-status.md`).

## `REPORT.md` — sections in this order

1. **Target and reality check**: origins, revisions, mode, what access was missing.
2. **Coverage**: a status count per lane with the denominator; route classes not examined, and why.
3. **Fixed this run**: finding → state reached → live proof.
4. **Open, agent-fixable next**: P0→P3.
5. **Owner-only**: each row also appended to the project's `docs/MANUAL-TASKS.md`.
6. **Hypotheses reconciled**: email/vendor claim → check → disposition.
7. **Competitors**: a pointer to `docs/growth/competitors.md` plus the top 3 positioning hypotheses.
8. **Before → after**: the same metrics under the same conditions; no causal claims.
9. **Next command**: e.g. `/product-audit resume`.

Redaction: no tokens, cookies, keys, emails, real names, record contents or payment ids in any file. A
secret's location and type only.
