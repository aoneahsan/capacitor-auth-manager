---
name: aoneahsan-cccs-programming-principles
description: 'Design-level reasoning for structuring code: DRY, KISS, YAGNI, SOLID, separation of concerns, composition over inheritance, Law of Demeter, CQS, and the Gang of Four patterns. Use when designing a module or service, when a file grows hard to reason about, or when choosing between abstraction and duplication.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/prompt-logs.md
---

# Programming principles and patterns

`aoneahsan-cccs-coding-standards` says what the code must not do. This skill is about **shape** — how to
divide responsibility so a change stays local.

## The principles, and what each actually prevents

| Principle | Prevents |
|---|---|
| **DRY** | one behaviour edited in three places, two of which get missed |
| **KISS** | cleverness only its author can maintain |
| **YAGNI** | abstractions built for requirements that never arrive |
| **Separation of concerns** | a change to formatting forcing a change to fetching |
| **Encapsulation** | callers depending on internals you wanted to change |
| **Composition over inheritance** | deep hierarchies where behaviour is inherited by accident |
| **Law of Demeter** | `a.b().c().d()` chains that break when any link changes |
| **Least astonishment** | a function whose name lies about its side effects |
| **CQS** | a "getter" that mutates |
| **No premature optimization** | complexity paid for a bottleneck that was never measured |
| **Hollywood principle** | modules reaching upward instead of being called |

**SOLID**, restated concretely: one reason to change per module (S); extend without editing (O); a subtype
must be usable wherever its parent is (L); many small interfaces beat one wide one (I); depend on
abstractions, not concretions (D).

## DRY has a failure mode — read this before extracting

Two pieces of code that *look* alike but change for **different reasons** are not duplication. Merging them
couples two independent concerns and the next requirement forces a flag parameter, then another. The test is
not "do these look similar?" but **"will these always change together?"** If the answer is no, leave the
duplication. Premature DRY causes more damage in this codebase's kind of work than repetition does.

## Choosing a pattern

Patterns are vocabulary for a shape you have already discovered — never a starting point. Reach for one when
you can name the specific pain it removes:

- **Creational** — Factory Method / Abstract Factory when construction varies by context; Builder when a
  constructor has grown many optional parameters; Prototype when copying beats rebuilding; Singleton only for
  genuinely single resources (it is a global, with all that implies — prefer module-scope or injection).
- **Structural** — Adapter to fit a mismatched interface; Facade to hide a messy subsystem behind one entry
  point; Decorator to add behaviour without subclassing; Proxy for lazy loading, caching, or access control;
  Composite for tree-shaped data; Bridge to vary abstraction and implementation independently; Flyweight only
  under real memory pressure.
- **Behavioural** — Strategy for interchangeable algorithms; Observer for event fan-out; Command to make an
  action a value you can queue or undo; State to replace a sprawling status conditional.

If you cannot name the pain, you do not need the pattern.

## Applying this to a unit

For each module, answer three questions: **what does it do, how do you use it, what does it depend on?** If
someone must read its internals to answer the first two, the boundary is wrong. If you cannot change the
internals without breaking callers, the boundary is wrong.

A file that has grown large is the signal, not the problem — it usually means several responsibilities are
sharing a home.

For pattern-by-pattern detail with worked TypeScript examples, read `references/patterns.md`.
