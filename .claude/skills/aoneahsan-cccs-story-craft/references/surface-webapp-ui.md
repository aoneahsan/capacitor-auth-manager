# Surface — web app UI copy

Microcopy is read in a fraction of a second by someone trying to do something else. The palette's dominant
band lives in headings and empty states; humor, when the Bible allows it, lives only in empty states and
success moments — never in errors, never in a confirmation that destroys something.

## Length and shape per element

| Element | Shape | Limit |
|---|---|---|
| Button | verb + object ("Save draft", "Export CSV") | 1–3 words; never "Submit", "OK", "Yes" |
| Label | the noun the user thinks of, not the field's name in the schema | ≤ 3 words |
| Toast | one clause, past tense, what changed | ≤ 8 words; undo beats confirm |
| Error | what happened · how to fix · (who to contact) | ≤ 2 sentences; no "Oops", no exclamation |
| Empty state | heading + one sentence of the after-state (BAB) + one action | heading ≤ 6 words |
| Loading | what is being fetched, in the user's words | ≤ 5 words; a boot loader says the product name |
| Confirmation | the consequence, then the choice; destructive verb on the destructive button | ≤ 2 sentences |
| Tooltip / info popover | what · why · an example | ≤ 25 words, or it is a doc page |
| Onboarding screen | one idea, one picture, one action | ≤ 40 words |

## Structure

- Onboarding maps to the Story Circle (`frameworks.md`): welcome (You) → the problem named (Need) → first
  setup (Go) → first attempt (Search) → first success (Find) → the honest limitation (Take) → home (Return).
- Empty states use BAB: this is what the screen looks like once it has data; here is the one step to get
  there.
- Errors follow the consequence shape in `safety.md` when something was lost; otherwise plain.

## Traps specific to this surface

- A string typed inline instead of through `t()` — every user-visible string goes through the i18n
  mechanism from day one (`~/.claude/rules/i18n.md`, `aoneahsan-cccs-i18n`).
- A toast as the default acknowledgement — the control itself answers within 100 ms; a toast is the
  fallback (`aoneahsan-cccs-interaction-feedback`).
- Personality on a failure — Walter's hierarchy: usable before pleasurable (`emotional-palette.md`).
- A confirm dialog where undo would do.
- "Your data never leaves your device" with a backend call — honesty rule (`aoneahsan-cccs-copywriting`).
- Copy that differs from the approved click dummy — the dummy owns the words
  (`~/.claude/rules/frontend-ui-standards.md` §10).

## Self-check for this surface

Every string has a home in the i18n catalogue · no error carries a joke · every empty state has exactly one
action · the shortest and longest string on the screen differ in shape, not only length.

Related: `aoneahsan-cccs-react-ui-ux` (boot loaders, empty and error pages) ·
`aoneahsan-cccs-react-form-components` (field-level copy, the upload info popover).
