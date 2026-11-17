# Surface — email sequences

An email is one idea, sent to one person, who can leave at any time. A sequence is a story told across
days; the palette's ratio spreads over the sequence, not inside each email.

🔴 **Marketing, outreach and campaign emails do NOT use the short shape below** (owner, 2026-09-30). They are
long and scannable: sections, real product screens, big bullets, short sentences, and "what it is" in every
email. They are written one at a time, each approved before the next. Contract:
`aoneahsan-cccs-email-campaigns/references/marketing-email-content.md`. The shape below is for relational
and lifecycle mail only.

## Shape

| Element | Rule |
|---|---|
| Subject | ≤ 45 characters; a specific, not a tease; never ALL CAPS, never "Re:" fakery |
| Preheader | ≤ 90 characters; continues the subject, does not repeat it |
| Body | 80–200 words; one idea; plain-text feel even in HTML (relational/lifecycle only — see above) |
| CTA | one, as a sentence or a single button; the link text says where it goes |
| Sign-off | "The {Product} team", the same every time — never a person's name (`storytelling-content.md`) |
| Unsubscribe | visible, one click, honoured before the next send |

## Sequence structures

- **Onboarding (3–5 emails):** BAB on day 0 (the after-state), one capability per email after, the
  honest limitation in the middle, no email that exists only to "check in".
- **Launch / nurture (4–6):** PAS across the sequence — the problem named (1), what it costs (2), the
  mechanism (3), proof with a source or a named person (4), 4Ps on the last one (5).
- **Re-engagement (1–2):** what changed since they left, one sentence; no guilt, no "we miss you".
- **Transactional:** not a sequence and not this surface — what happened, what to do, done.
  Its layout, facts card and footers are fixed by
  `aoneahsan-cccs-email-campaigns/references/transactional-email-layout.md`; the Bible's voice and the email's
  content-map row still own every word, from its one catalogue.

## Voice

Second person, the Bible's dominant band, shorter sentences than the blog. Burstiness across the sequence
too: one email can be four lines. The owner's own emails use `aoneahsan-cccs-story-personal-voice`, never
the product's voice.

## Sending

Outbound mail goes through FilesHub (`aoneahsan-cccs-fileshub`); segments, batching, quotas and the
unsubscribe gate are `aoneahsan-cccs-email-campaigns`. The draft records which segment it is for and its
place in the sequence in the content map row.

## Traps

- Fake scarcity, fake countdowns, "only 3 left" the product cannot count — banned.
- A subject line the body does not honour (an unclosed curiosity gap, and a spam signal).
- Agitation (PAS step 2) on an audience the safety reference protects — use BAB.
- A number without a source.
- A sequence where every email is the same length and shape.
