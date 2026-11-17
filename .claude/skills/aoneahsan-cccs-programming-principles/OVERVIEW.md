# Overview — `aoneahsan-cccs-programming-principles`

## Purpose

Design-level judgement: how to divide responsibility so that a future change stays local. Where
`aoneahsan-cccs-coding-standards` sets a quality floor, this skill informs the structural decisions that
determine whether a codebase stays workable at month six.

## What this skill does

- States the classic principles (DRY, KISS, YAGNI, SOLID, SoC, encapsulation, composition over inheritance,
  Law of Demeter, least astonishment, CQS, no premature optimization, Hollywood) **paired with the specific
  failure each one prevents**, so they are decision tools rather than slogans.
- Gives the counter-rule to DRY: similar-looking code that changes for different reasons is not duplication,
  and merging it couples independent concerns.
- Maps the Gang of Four creational, structural and behavioural patterns to the concrete pain each removes,
  with an explicit rule that a pattern you cannot justify by naming the pain is not needed.
- Supplies the three-question test for any module boundary: what does it do, how is it used, what does it
  depend on.

## When it gets invoked

- Designing a new module, service, hook or component.
- A file or function has grown hard to hold in your head, or a change keeps rippling outward.
- Deciding whether to extract a shared abstraction or accept duplication.
- Choosing between two structural approaches, or naming the pattern in a review.
- Refactoring inherited code, or during an architectural kickoff.

## Where it applies

Every language and stack — these are structural principles, not framework rules.

## Sources

`_source-understanding/files/prompt-logs.md` (the owner's explicit principle and pattern list, with the
reference links to refactoring.guru, sourcemaking.com and github.com/webpro/programming-principles).

## Related skills

`aoneahsan-cccs-coding-standards` (the quality floor) · `aoneahsan-cccs-typescript` (type-level expression of
these boundaries) · `aoneahsan-cccs-react-components` (component-level composition).

## Maintenance

Stable material — principles do not churn. Revisit only if the owner adds to the list.
