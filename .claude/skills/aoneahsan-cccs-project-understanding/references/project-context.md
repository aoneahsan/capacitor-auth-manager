# Project context contract

Use `docs/PROJECT-CONTEXT.md` as the compact, durable explanation of one ongoing project. It complements
`CLAUDE.md` / `AGENTS.md`: those files tell agents how to work; this file records what the project is and what
the owner has decided.

## Compact format

```markdown
# Project Context — <project name>

Last Updated: YYYY-MM-DD
Verified Against: <commit or date>

## Identity and outcome
- Purpose:
- Primary users:
- Current status:
- Production URL / distribution:

## Chosen architecture
- Runtime/framework:
- State/data:
- Auth:
- Storage/backend:
- Deployment:
- Deliberate stack deviations:

## Durable owner decisions
- <decision>: <choice and short reason, YYYY-MM-DD>

## Constraints and non-goals
- Must:
- Must not:
- Explicitly out of scope:

## Key paths and contracts
- `<path>` — <why it matters>

## Verification
- Standard gates:
- Runtime verification:

## Open material unknowns
- None.
```

## Update rules

- Record only facts a future session needs to avoid rediscovery or a repeated owner question.
- Cite repository evidence or the dated owner decision. If the fact is inferred, verify it before recording.
- Replace superseded decisions; do not retain two active answers. Keep a one-line date when the reason matters.
- Keep feature-specific choices in that feature's tracker, not here.
- Point to global rules and knowledge bases; never copy them into the project.
- Delete stale entries in the same edit. `Last Updated` changes only when content changes.
- Do not create the file for a trivial edit or a disposable experiment.

## Read order

Read this file after one nearest native instruction file and the relevant README section, before asking the owner a
project-level question. The owner's current instruction always replaces an older recorded choice; update this
file after the answer so the next session sees the new decision.
