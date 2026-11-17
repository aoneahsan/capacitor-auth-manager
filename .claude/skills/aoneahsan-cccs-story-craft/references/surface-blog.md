# Surface — blog post / article

A blog post has two readers at once: the person who arrived with a question and the engine deciding
whether to cite the page. Answer-first serves both; the story keeps the person.

## Shape

- Length: 900–1,800 words for an ordinary post; the per-page uniqueness floor is ~1,000 words with a
  purpose-led introduction and relevant recurring questions (`aoneahsan-cccs-seo-content-writing`).
- Structure: Story Circle for a change-story, Kishōtenketsu for a reflective one, Freytag for a case study
  with a number. Declare the structure in the self-check.
- Headings: question-based H2s in the reader's search words; the H2 set alone reads as the argument.
- The first paragraph under each question H2 answers it directly. Then the specific detail, then
  the story (`aeo-seo.md`).
- One hook (`hooks-and-memorability.md`), one open loop, one CTA at the end — internal, to the product or
  the next post.
- Named author with a real bio line, a visible updated date, cited numbers with source names.

## Voice inside the structure

The palette's dominant band opens and closes; minority bands appear once per ~300 words. Burstiness is
easiest here and most often missing — read the post aloud before the review. One-sentence paragraphs are
allowed and should exist.

## What goes in the content map row

Target question(s) · the awareness level · the structure · target length · the CTA · schema type
(Article, FAQPage) · the internal links it must carry.

## Traps

- A summary conclusion ("In conclusion, …") — end on the last fact.
- A statistic without a source, or a source quoted from memory. Verify or cut.
- Keyword repetition to "help SEO" — it lowers AI visibility.
- A question H2 whose answer is three paragraphs down.
- The post's crawler body re-typed instead of generated from the same content contract
  (`aoneahsan-cccs-seo-content-writing`).
- A `<textarea>` in the authoring UI — every multi-line input is a rich-text editor
  (`~/.claude/rules/frontend-ui-standards.md` §9b), and every external link opens in a new tab with the
  do-follow policy applied (§15).

Related: `aoneahsan-cccs-feed` (the post is in `/feed.xml` on build) · `aoneahsan-cccs-react-aeo` ·
`aoneahsan-cccs-search-indexing` (getting it indexed after publishing).
