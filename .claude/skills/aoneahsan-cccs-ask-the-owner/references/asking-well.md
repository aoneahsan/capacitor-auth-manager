# Asking well — question-quality patterns

## Shape of a good blocking question

1. **I NEED THIS FROM YOU:** one-line statement of the missing decision/input.
2. **Why it blocks:** one sentence — what goes wrong or gets redone if guessed.
3. **Options (2–4), recommendation first**, each with a one-line consequence. The owner should be able to
   answer with one word.
4. **Default-on-answer:** say what happens immediately once answered, so the owner knows the cost of the
   pause is exactly one reply.

## Patterns

- **One topic per question.** A question that bundles two decisions gets half an answer.
- **Batch the pause, not the questions.** If three independent blockers exist, ask all three in ONE pause
  (structured multi-question where the agent supports it) — serial interruptions burn the owner's time.
- **Multiple choice beats open-ended.** "A, B, or C (recommend A)" is answerable from a phone in seconds;
  "what do you think about X?" is not.
- **Never a blank page.** No options + no recommendation = the agent outsourcing its job.
- **Quote the conflict.** For rule conflicts, cite both rules by file/section so the owner rules on the real
  text, not a paraphrase.
- **Re-ask verbatim.** When holding against "continue", repeat the same ask — reworded asks read as new
  questions and stall differently.

## Recording answers

| Answer type | Record it in |
|---|---|
| Product/feature decision in multi-phase work | the feature tracker's `userDecisions` |
| Decision that changes an approved plan | the plan file (append, dated) |
| Fact that corrects a knowledge base | the relevant `~/.claude/rules/` record, same task |
| One-off task-scoped call | the final report, one line |

An unrecorded answer will be re-asked by the next session — that is a process failure, not a memory quirk.
