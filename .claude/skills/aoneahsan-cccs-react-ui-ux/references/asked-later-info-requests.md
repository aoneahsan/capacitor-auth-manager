# Asking for something onboarding did not ask for — and switching everything on by default

Two owner directives, both given on lifewell on **2026-09-20** and both fleet-general.

> *"when we change anything in onboarding, like start asking for new stuff, for those who have completed
> onboarding onalready we need to have a better way, we should on their dashboard show, "We Need this info to
> better serve you" in better wording offcourse, we user should be able to dismiss that notice and only show
> that after 7 days and can be dismissed for 7 days again, and in setting page have a new session which only
> show up if we need additional info from user… and there explain each time any new entery data/info we need
> from user, like how it will benefit user, what part of lifewell will use it and how it will make it a better
> place for them"*

> *"on onboarding flow, please make sure that we have all stages and reminders enabled by default and user can
> choose to off any if needed"*

---

## 1. The problem this solves

Onboarding grows. A question added in month four is asked of everybody who signs up afterwards and of nobody
who signed up before — so the product quietly holds two populations, and the older one is the one that has
been there longest. The usual answers are both wrong: re-running onboarding punishes the loyal, and a
permanent "complete your profile" bar is nagging with no way out.

## 2. The registry — one file, and a new question is a row in it

Every asked-later item is declared once, in code, never in the database:

| Field | Holds |
|---|---|
| `key` | short, stable, `^[a-z_]{1,40}$` — it is written into the declined list, so it outlives a refactor |
| `addedAt` | 🔴 **the date the question entered the shipped product**, read from `git log --diff-filter=A` on the step file — never guessed, never "today" |
| `isMissing(profile)` | the one predicate that decides whether this person still owes it |
| `textKey` | the catalogue key for its four sentences (§4) |
| `Editor` | the field itself, saving through the surface's existing write |

**An item is outstanding when all four hold:** onboarding is complete · `item.addedAt` is **after** that
person's `onboarding_completed_at` · `isMissing` · the key is not in the declined list.

🔴 The third clause is what keeps a new member from being asked for something their own onboarding already
covered, and the second is what stops the whole mechanism firing at everybody the day it ships.

## 3. The notice

A dismissible card or banner on the first screen after sign-in — **one notice, never two.** A product that
already has a "finish your profile" nudge **replaces** it rather than stacking beside it.

- **Two actions:** one goes to the settings section, one dismisses.
- **Dismissal lasts 7 days**, and may be taken again, indefinitely. Dismissing is not declining.
- 🔴 **The snooze is stored on the ACCOUNT, not the device.** In `sessionStorage` it returns on the next tab,
  in `localStorage` it returns on the next phone — either one makes "dismissed for 7 days" a lie, and the
  person cannot tell which of the two they are looking at.
- Drawn in the click dummy first, like any other surface (`~/.claude/rules/frontend-ui-standards.md` §10a).

## 4. The settings section — conditional, and it explains itself

A section that **exists only while something is outstanding** and disappears when the last item is answered or
declined. It is the whole point of the directive: the notice asks, this is where the asking is justified.

Per item, four things, in the product's voice:

1. **What is asked** — the plain name of the field.
2. **Which part of the product uses it** — a named surface, not "the experience".
3. **What the person gets** — the benefit to them, not to the business.
4. **The field itself**, plus a real decline — *"I would rather not say"* — which ends the asking for that item
   permanently and is honoured everywhere, not merely hidden.

🔴 **Only a use you can cite from the code may be written.** Grep the column's readers first; a benefit
sentence nobody can trace is marketing inside a settings page, and it is the sentence a person will remember
when the feature does not do it.

## 5. Where the two values live

Two columns on the profile — nothing more:

- `info_snoozed_until timestamptz null`
- `info_declined text[] not null default '{}'`, with a CHECK on **length and a character pattern**, never an
  enum of keys — 🔴 an enum turns every future question into a migration, which is the thing the registry
  exists to avoid.

🔴 **On a project with column-scoped UPDATE grants, both columns must be added to the grant** in the same
migration, or every dismissal fails with a permission error naming the table and not the column.

## 6. The pre-approved tests (and only these)

The predicate and the seven-day arithmetic **across a timezone boundary and a DST change** — pure logic whose
wrongness is invisible, so it qualifies under the minimum-tests grant. Watch each go red on a plant. No
component-render suite for the notice.

## 7. The second directive — everything starts ON

**Every domain, stage, category and reminder an onboarding offers starts switched on**, and the person
switches off what they do not want. Opting out of what you can see beats opting in to what you have not met
yet, and a first-run product that arrives empty looks broken rather than respectful.

Three consequences:

- **The copy around it has to change with it.** A lede that says "this starts at almost nothing" becomes false
  the moment the defaults flip — and it is an approved sentence, so it is amended in the dummy, not quietly
  rewritten in the app.
- 🔴 **The product-wide default is NOT what changes.** Flip the constant a settings screen reads, and every
  existing member who never touched that setting is switched on overnight. Change the **onboarding answer's**
  defaults, and write that answer into the preference store on finish.
- **A patch writes what the person switched OFF**, not the whole array. Ticking one box must not send five
  untouched values back as though they had been decided.

**First applied:** lifewell WP012, 2026-09-20 (`docs/features/wp012-findings-seats-audit/`).
