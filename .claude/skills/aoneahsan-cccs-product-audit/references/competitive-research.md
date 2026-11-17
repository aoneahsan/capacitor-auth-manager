# Competitive research (COMP-01…05) — the Seeto-style matrix, done honestly

Runs **every full run**, bounded (owner, 2026-10-26). Public pages only, no sign-ups, no paid tools, no
scraping against a site's terms. The output informs positioning. It is never copied into product copy
without the dummy and the story system.

## COMP-01 — choose the set (3–5)

Choose by the **job the user hires the product for**, not by visual similarity. Include at least one direct
competitor, one substitute (spreadsheet, notes app, paper) and the status quo ("doing nothing"). Record why
each is in the set. Reuse the previous run's set unless the market moved, and say so.

## COMP-02 — the matrix

One row per feature or dimension, one column per product (ours first). Every cell carries:

| Field | Values |
|---|---|
| value | the observed fact, short |
| status | `verified-public` · `vendor-claimed` · `inferred` · `unknown` |
| source | URL |
| retrieved | `YYYY-MM-DD` |
| tier/region | which plan and region the fact applies to |

🔴 "Not found" is `unknown`, never "not supported". 🔴 Ours is filled from **tested** product evidence (this
run's findings), not from our marketing.

## COMP-03 — pricing intelligence

Normalise currency, interval (monthly vs annual), per-seat vs flat, limits, add-ons, trial and region, and
date every price. A price that is not published is `unknown`, never free. Feed the comparison into PAY-03 and
D25. 🔴 Never propose changing our prices: plan design is the owner's (`aoneahsan-cccs-plans-entitlements`).
Record observations only.

## COMP-04 — four dimensions, scored with anchors

Score each product 0–3 per dimension, with the evidence beside the score. Unknown stays unknown and stays in
the denominator.

| Dimension | 0 | 3 |
|---|---|---|
| Website quality | broken or slow, unclear navigation | fast, clear, accessible, every CTA works |
| Messaging | generic, feature soup | names the audience, the problem and the outcome in the first screen |
| Trust | no identity, support or policy | clear team identity, support, policies, real proof |
| Differentiation | interchangeable | a specific workflow or trade-off only it offers |

## COMP-05 — output

Write `docs/growth/competitors.md` in the product repo (or the project root for a kit layout). It holds:
- the set and the reasons for each pick;
- the matrix;
- the pricing table;
- the dimension scores;
- **positioning hypotheses**, each with the evidence it rests on and a validation step (user feedback, an experiment row in `docs/growth/`, `app-growth.md`);
- a fair battle card: who each alternative suits better, and our honest gaps.

🔴 Never copy competitor text, use their logos or invent their weaknesses. Published comparison pages are required since
2026-11-07 and follow `aoneahsan-cccs-comparison-hub`; when `docs/comparison-hub/competitors.json` is current, cite it
instead of researching again.
