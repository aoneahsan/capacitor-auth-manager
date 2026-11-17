# Safety — crisis signposting, non-judgmental language, and consequence surfaces

These rules override the palette, the framework and the hook. A surface is a safety surface when it
touches mental health, crisis, medicine, law, money, or an error that cost the reader something. The Story
Bible § Safety constraints names which apply to the project; the writer applies them without being asked.

## Mental-health and therapy surfaces

- **Crisis signposting is present, visible and correct for the locale.** Never invent a number. Verify the
  line for the project's locale before shipping and record it in the Bible: in the US the 988 Suicide &
  Crisis Lifeline (call or text 988); in the UK, Samaritans on 116 123. Other locales are a `NEEDS DECISION`
  until verified.
- **Non-judgmental language.** No "failed", "lapsed", "broke your streak", "lazy". A missed day is a missed
  day. Describe, never grade.
- **Autonomy and consent.** The reader decides; the app offers. "You can", never "you must". Reminders are
  opt-in; the copy says how to turn them off in the same sentence that offers them.
- **No diagnosis, no clinical claims.** The app tracks, reflects, supports. It does not "treat", "cure",
  "reduce anxiety by 40 %". Unless the project's Bible carries a verified clinical basis, the word "therapy"
  describes a category, not a promise.
- **"Complement, not replace."** State it once, plainly: the app works alongside professional care, not
  instead of it.
- **No urgency manipulation, no shame-based motivation.** No countdowns, no "don't lose your progress",
  no streak guilt. Agitation (PAS) is banned here; use BAB.
- **Humor is off.** Warmth stays. See `emotional-palette.md`.

## Legal, medical and financial consequence

- The copy never gives advice in the reader's specific situation; it explains the general case and points to
  a professional. "This is general information, not legal advice" appears where a reader could mistake it.
- No guarantees, no outcome promises, no "you will save".
- Numbers are sourced or absent (`aoneahsan-cccs-copywriting`).
- Where a product handles health data, the PHI rules apply to every string that could contain it —
  `aoneahsan-cccs-phi-safe-engineering`.

## Errors of consequence

An error that lost data, charged money, locked an account, or wasted real time follows one shape, in this
order: **what happened** · **what it means for the reader** (what is safe, what is lost) · **what to do
now** · who to contact if that fails. No personality, no apology theatre, no exclamation mark. Plain error
copy for everything else: `aoneahsan-cccs-react-ui-ux`.

## Store and compliance

Store listings on any surface follow the banned-word and honesty rules in `aoneahsan-cccs-copywriting` and
`~/.claude/rules/publishing-compliance.md`; a mental-health app's listing additionally never claims a
clinical outcome.

## 🔴 A yes/no COLUMN HEADER converts every cell under it into an answer

A table headed `Recoverable?` asks a closed question, so a reader takes each cell as the answer to it —
whatever the cell actually says. On a windowsweep tier table the Rebuilds cell read *"The data reappears on
demand; a rebuild costs time, not information"*. True, useful, and it reads as **yes** for a tier that has no
undo. The page said "no undo" six headings later.

That is a safety violation rather than a wording preference, and it is easy to miss because **every
individual cell is accurate**. The defect is in the header: it promises a yes/no and the cells answer a
different question.

**The fix is structural, and it loses nothing.** Make every row answer the question the header actually asks
— `No undo` · `The Recycle Bin, until you empty it` · `Nothing is removed` — and move regeneration, rebuild
cost and reversing commands into the tier's **label** or the sentence after, where they describe rather than
answer. The reader still learns a cache comes back; they simply learn it after learning it is not recoverable.

**Generalise it:** before shipping a table on a consequence surface, read the header as a question and each
cell as its answer, out loud. If any cell answers a different question, the header or the cell is wrong.
Watch for `Reversible?`, `Safe?`, `Affects my files?` and `Can I undo this?` — a `?` in a header is the tell.

## The reviewer's hard flags

The humor/emotion reviewer flags, as a hard failure rather than a suggestion: a joke on a safety surface ·
a missing or unverified crisis line · a diagnosis or outcome claim · shame or urgency language on a
vulnerable audience · an error of consequence with personality. Each is `NEEDS DECISION` if the writer
believes the Bible permits it; the reviewer does not resolve it alone.
