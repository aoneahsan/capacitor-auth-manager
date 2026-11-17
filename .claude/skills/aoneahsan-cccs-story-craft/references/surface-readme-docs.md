# Surface — README and documentation

Most of a README is reference prose and belongs to `aoneahsan-cccs-npm-package-readme` (section order, emoji
map, badges) and `aoneahsan-cccs-markdown` (anchors, tables, fences). The story writer owns three places:
the opening, the "why this exists" paragraph, and the tone of every sentence a person reads before they copy
a command.

## The opening — PAS in two sentences

The problem in the reader's words, then the tool. "Capacitor apps need a store release for every copy fix.
native-update ships the web bundle over the air, signed, with rollback." No adjectives, no "powerful", no
"simple yet flexible". The reader is problem-aware or solution-aware (`copywriting-frameworks.md`); open at
their level.

## "Why this exists"

One short paragraph, first person plural allowed once. The real reason, including the constraint that
shaped it ("Firebase Functions needs the paid plan; this runs on the free tier"). Honesty here is the
credibility the rest of the README spends.

## Docs pages

- Headings are tasks ("Send an email", "Rotate a key"), never nouns ("Email", "Keys").
- One complete example per concept, real values in the shapes the tool actually accepts, secrets shown as
  placeholders only.
- Error messages quoted verbatim, then what they mean, then the fix.
- The limitation stated beside the capability, every time (`~/.claude/rules/deferred-issue-tracking.md`:
  "state the limit next to the claim").
- No marketing in docs. The feature list is a table; the adjectives are deleted.

## Tone

Plain, direct, present tense. Contractions if the project's Bible allows them. Humor: at most one dry line
per page, never in an error or a warning callout. Burstiness still applies — a docs page of uniform
sentences reads as generated even when every fact is right.

## Traps

- A README that restates the docs site, or a docs site that restates the README — single-home rule
  (`aoneahsan-cccs-markdown`); one is the home, the other links.
- A relative link in a package README (dead on npmjs.com).
- "Coming soon" — the no-TODO policy applies to prose too.
- A support link anywhere but `aoneahsan.com/payment` (`~/.claude/rules/public-repo-governance.md`).

Related: `aoneahsan-cccs-documentation` (brevity budget, fixed paths) · `aoneahsan-cccs-docusaurus` (docs
site front matter and admonitions).
