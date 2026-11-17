# Surface — portfolio

A portfolio is read by someone deciding whether to trust the owner with money or a problem. Proof moves
them; adjectives do not. The structure is the Hero's Journey with the client — or the product's user — as
the hero and the owner as the guide who was there.

## The project page

1. The situation, in the client's terms — what was broken, what it cost them, in one specific.
2. The constraint that made it hard (budget, timeline, a 2 GB Android floor, an existing database).
3. What shipped — named screens, named integrations, a live link.
4. The measured result — a number with a source (their analytics, a store rating, a load time). No number
   → the concrete artefact, never an invented figure.
5. What I would do differently — one honest sentence. This line is what makes the rest believable.

Length: 250–500 words per project; more is a case study and belongs on the blog.

## The home page

StoryBrand order (`copywriting-frameworks.md`): the visitor's problem · the owner as guide (one line of
authority, one of empathy) · the plan (how working together goes, three steps) · the call to action · what
failure looks like without help (one line, no fear-mongering) · success. The owner's own voice, in his
fingerprint, from the first sentence.

## Calls to action

One main CTA per page, the same on every page: contact / start a project. Support and payment links go to
`aoneahsan.com/payment` only. Never "hire me" pleading; a plain "Tell me about the project" in his voice.

## Links and identity

Every project link, identifier and contact comes from the master links JSON in the notebook — the source of
truth for the portfolio (`~/.claude/rules/portfolio-and-social.md`). External links open in a new tab; only
his own products and profiles are do-follow (`~/.claude/rules/frontend-ui-standards.md` §15). A published
app's identifier is never changed in copy or code.

## Traps

- Adjective stacks ("innovative, scalable, user-friendly") — replace each with a fact or delete.
- A testimonial that cannot be attributed to a named, consenting person — leave it out.
- Marketing copy or social assets committed to a client's repo — they live in the notebook
  (`~/.claude/rules/client-projects.md`).
- A screenshot without a caption stating what the reader is looking at.
