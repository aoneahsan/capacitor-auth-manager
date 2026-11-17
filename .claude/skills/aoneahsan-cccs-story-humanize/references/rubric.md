# The rubric — exact measures, the judgment checklists, the score sheet

## Preparation

Strip front matter, HTML comments, code fences, headings and table rows; score the running prose only.
Word = the validator's regex `\b[\w'-]+\b`. Sentence = a run ending in `.`, `!` or `?` followed by space or
end, or a line break after two or more words; a fragment of one word counts as a sentence. Paragraph = a
blank-line-separated block.

## Deterministic criteria (the hook computes these identically)

| # | Criterion | Computation | Pass |
|---|---|---|---|
| 1 | Burstiness | standard deviation of sentence lengths (words) ÷ mean, over the whole text (≥ 5 sentences; otherwise skipped) | ≥ 0.45 |
| 2 | Range | for each 150-word window: at least one sentence ≤ 6 words and one ≥ 25 words (texts under 150 words: over the whole text) | every window |
| 3 | Banned phrases | each line of `banned-phrases.txt` as a case-insensitive whole-word match, whitespace in a phrase matching any whitespace; a phrase named in `<!-- story-lint: allow "…" -->` is exempt | 0 |
| 4 | Em dashes | count of `—` (and ` -- `) per 150 words | ≤ 1 |
| 5 | "not X, but Y" | regex `\bnot (only |just |merely )?[^.!?]{1,80}\bbut (also |rather )?` per 300 words | ≤ 1 |
| 6 | Triplet reflex | lists of exactly three comma-separated items ending in `, and X` per 500 words | ≤ 2 |
| 7 | Opener repetition | three or more consecutive paragraphs whose first word is the same | absent |
| 8 | Throat-clearing | the first sentence begins `In this (post|article|guide)`, `In today's`, `Let's dive`, `Welcome to` | absent |
| 9 | Summary tell | the last paragraph begins `In conclusion`, `In summary`, `To sum up`, `Overall,`, `Ultimately,` | absent |

The hook reports FAIL rows only, on stderr, with the offending sentence or phrase quoted once each, in at
most twelve lines. Score mode prints every row.

## 🔴 Before trusting any of the above on a SLOT-SHAPED surface: measure the hook, per file

The hook strips fenced code blocks before it counts anything. On a surface written as numbered slots — one
fence per shipping string — that means **none of the real words are checked**, and a green exit says only
that the surrounding commentary is clean. The rule is recorded globally, but a claim about a hook is only
true of the hook you ran, and a stripping regex is one edit away from behaving differently.

**The measurement costs one command and turns the rule into evidence.** Work on the real draft and restore
it, or on a scratch copy:

| Step | Where the planted text goes | Expect |
|---|---|---|
| treatment | a banned phrase **inside a slot fence** | **exit 0, silent** — every shipping string is unchecked |
| control | the identical sentence **in a Change paragraph** | **exit 2, named** — the hook is live, so the exit 0 above was blindness and not a broken invocation |

**The control is what makes it evidence.** Without it, exit 0 is indistinguishable from a hook that failed to
run, a path typo, or a file the hook never saw.

**Restore and prove the restore** — compare md5 before and after, not by eye. A plant left behind in a draft
is worse than never having measured.

Then say so in the report: on this surface the fact-checker and a human reader are the only real gate, and a
green hook is not evidence about the copy. Writing that sentence is the point of the exercise — it stops the
next reader citing a number that was never measured.

## Judgment criteria (a reader scores these)

**10 — Specificity.** Walk the sections (an H2, or every ~200 words). Each must hold one of: a number with
a unit · a named thing (screen, file, role, place) · a time · a stated constraint · a sensory detail. Quote
the specific in the sheet. "Powerful", "modern", "comprehensive" are not specifics.

**11 — Point of view.** Somewhere the writer commits: a preference, a verdict, an "I'd" or "we chose". A
text that only describes has none.

**12 — Hedging.** Where the fingerprint hedges, the text hedges: "about", "roughly", "probably", "as far as
I can tell", "I think". Absent in a voice that hedges → FAIL; present in a voice that is blunt by fingerprint
→ note, not fail.

**13 — Voice match.** Print three sentences from the draft under three sample sentences from the
fingerprint. Could a cold reader sort them? If yes, FAIL, and say which feature gives it away (length,
opener, diction, punctuation).

**14 — Palette.** For each band in the Bible's ratio, name where it lands in the draft. A band with no
landing, or a minority band that took over the opening, is a FAIL.

## The score sheet

```
HUMANIZE — <surface> — checked against docs/story/voice-fingerprint.md (calibrated: yes|no)
 1 burstiness      0.52  PASS
 2 range           PASS
 3 banned          0     PASS  (allowed: "robust" — reason in finalizer note)
 4 em dashes       0.7/150  PASS
 5 not-X-but-Y     2/300  FAIL  → "not just a tracker, but…" (§2)
 6 triplets        1/500  PASS
 7 openers         PASS
 8 throat-clearing PASS
 9 summary tell    FAIL  → last paragraph opens "Overall,"
10 specificity     PASS  (§1 "11 pm"; §2 "2 GB Android"; §3 "the Tuesday gap")
11 point of view   PASS  ("I'd turn reminders off first")
12 hedging         PASS  (2/300)
13 voice match     PASS
14 palette         PASS  (warm-competent: opening + CTA · dry: §2 line 4 · gravity: §3 line 2)
VERDICT: 2 FAIL → rewrite mode on 5 and 9
```

## Rewrite moves per criterion

| Fails | Move |
|---|---|
| 1, 2 | split the longest sentence into two unequal parts; merge two short neighbours; add one three-word sentence after the longest paragraph |
| 3 | the plain word, or delete the clause |
| 4 | commas or parentheses |
| 5 | state Y alone; the "not X" was a contrast the reader did not need |
| 6 | two items, or four, or the one that matters |
| 7 | change the first word of the middle paragraph |
| 8, 9 | delete the sentence or paragraph; end on the last fact |
| 10 | NEEDS DECISION for the detail — never invent it |
| 11, 12 | one sentence in the writer's stance, in the fingerprint's hedge |
| 13 | rewrite the give-away feature only |
| 14 | move the minority line; give the dominant band the opening |
