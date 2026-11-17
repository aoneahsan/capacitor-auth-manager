# Plan structure + self-review

Write for an implementer who is skilled but knows nothing about this codebase or problem domain. Document
what to touch, the content, and how to verify it. DRY, YAGNI, frequent commits.

## Plan header

```markdown
# [Feature] Implementation Plan

**Goal:** [one sentence]
**Architecture:** [2-3 sentences on approach]
**Tech stack:** [key libraries — the project's chosen stack]

## Global Constraints
[Project-wide requirements, verbatim from the design — version floors (e.g. TypeScript ~6.0.3),
the data-fetch limit (default 20, max 50), banned packages, naming/copy rules, responsive range.
Every task inherits these.]
```

## Per-task shape

```markdown
### Task N: [Component]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`

**Interfaces:**
- Consumes: [exact signatures from earlier tasks]
- Produces: [exact function names + parameter/return types later tasks rely on]

- [ ] Step 1: [one action — write the real code, shown in full]
- [ ] Step 2: Run the gate — `yarn typecheck && yarn lint && yarn build` (expected: clean)
- [ ] Step 3: [run-to-verify if the change can be exercised]
- [ ] Step 4: Commit (one commit per prompt)
```

Each task is the smallest unit worth a fresh reviewer's gate: fold setup/config/scaffolding into the task
whose deliverable needs them; split only where a reviewer could reject one task while approving its neighbor.

## No placeholders (these are plan failures)

- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling / validation / edge cases" (show the actual handling)
- "Write tests for the above" with no code — and, for this owner, **no `write the failing test` steps at
  all** unless the design explicitly asks for tests (no-automated-tests rule). Verification is the gate cycle.
- "Similar to Task N" (repeat the code — tasks are read out of order)
- A type/function/method referenced but defined in no task

## The gate cycle (replaces TDD's test-first cycle)

Because the owner writes no automated tests unless asked, each task ends with:
1. `yarn typecheck` → 0 errors
2. `yarn lint` → 0 errors/warnings
3. `yarn build` → exit 0, no warnings
4. (when the change is user-visible and runnable) run-to-verify: background server on its registered port +
   headless browser via the kept `use_browser` tool, then kill it.
Map these to the project's real commands under the per-project stack override.

## Self-review (run once, fix inline)

1. **Coverage:** every requirement/section of the design maps to a task. List any gap; add the task.
2. **Placeholder scan:** search for the red-flag phrases above. Fix them.
3. **Type/name consistency:** a function called `clearLayers()` in Task 3 and `clearFullLayers()` in Task 7
   is a bug — reconcile.

## Executing with checkpoints

- Load the plan + tracker; resume the first `pending`/`in_progress` sub-task; never re-plan from zero.
- Follow steps exactly; run each gate; don't skip verifications.
- Stop and ask on a genuine blocker, ambiguity, or a step that contradicts the Global Constraints —
  don't guess.
- Mark sub-tasks complete + append a `runHistory` row as you go; one commit per prompt.
