# Humanize — burstiness, specificity, and the voice-fingerprint method

Detectors are unreliable and change monthly; "passing" one is not the goal. The goal is prose a specific
person could plausibly have written, which happens to be what detectors reward. Three levers do most of the
work, in this order: **syntax variety**, **specificity**, and **matching a supplied voice**. A word
blacklist is the floor under them, not a substitute.

## Lever 1 — burstiness

Machine prose converges on a medium sentence, over and over: 15–22 words, subject-verb-object, a
subordinate clause, a full stop. Human prose is jagged.

How to produce it on purpose:

- Follow a long sentence (25+ words, two clauses, a parenthetical) with a short one. Three words. Then a
  medium one.
- Allow fragments. "Not once." "Every Tuesday." They are punctuation for thought.
- Vary the opener: a noun, a verb, a "because", a number, a quoted word. Never three sentences in a row
  starting the same way.
- One-sentence paragraphs exist and carry weight; use one per ~400 words.
- Read it aloud. Where you run out of breath, split; where it sounds like a metronome, merge or cut.

The rubric in `aoneahsan-cccs-story-humanize` measures this as sentence-length standard deviation over the
mean (target ≥ 0.45) plus the presence of at least one ≤ 6-word and one ≥ 25-word sentence per ~150 words.

## Lever 2 — specificity

One detail per section that only someone close to the product would know. What counts:

- a number with a unit ("340 ms", "11 pm", "four screens", "2.3 MB")
- a named thing (the screen, the setting, the file, the person's role)
- a time, a place, a constraint ("it has to work on a 2019 Android with 2 GB")
- a sensory detail where the surface allows it
- a limitation stated plainly ("it does not sync while the app is closed")

What does not count: "powerful", "intuitive", "modern", "comprehensive". If the detail is not known,
`NEEDS DECISION` — never invent one.

## Lever 3 — voice matching (the fingerprint method)

Given 3–12 samples the owner supplies, extract and record in `docs/story/voice-fingerprint.md` (or the
personal-voice registry entry):

1. **Rhythm** — mean sentence length, spread, how often a fragment appears, paragraph length.
2. **Diction** — the 20 words they reach for; the words they never use; contraction rate; British or
   American spelling; how they write numbers.
3. **Punctuation habits** — dashes or commas, parentheses, exclamation marks (count them), ellipses, how
   they quote.
4. **Stance** — blunt or warm, first or second person, how they hedge ("I think", "probably", "roughly"),
   how they disagree.
5. **Openers and closers** — how a paragraph starts, how a message ends (sign-off, a question, a fact).
6. **Tells** — a phrase they repeat, a joke shape, a way of listing.

Then write 8–12 sample sentences in that voice, a do/don't diction list, and the burstiness target. Every
later draft is checked against those sentences, not against the adjectives that describe them.

## The rest of the human toolkit

- **Contractions** where the fingerprint uses them.
- **A point of view.** The writer thinks something. "I'd pick the second option" beats "both options have
  merits".
- **Restored hedging.** Humans say "about", "probably", "I think", "as far as I can tell". Machine prose is
  suspiciously certain.
- **Imperfection.** A sentence that starts with "And". A parenthetical that goes slightly too long.
- **No triplets by reflex.** Two items, or four, unless there are exactly three.
- **No "not X, but Y"** more than once per ~300 words; it is the most recognizable tell after the word list.
- **Em dashes budgeted** — at most one per ~150 words; commas and parentheses take the rest.
- **No summary paragraph.** End on the last fact or the emphatic line; never "In conclusion".
- **No throat-clearing opener.** Never "In this post we will", "In today's world", "Let's dive in".

## The banned list, and why it is not enough

`assets/banned-phrases.txt` (in this skill) is the one list both the humanize skill and the lint hook read.
A draft may allow one phrase deliberately with `<!-- story-lint: allow "robust" -->` on its own line, with
the reason in the self-check. Replacing every banned word with a synonym produces prose that is still
metronomic and still vague — the list catches the obvious tells, the three levers above catch the rest.
