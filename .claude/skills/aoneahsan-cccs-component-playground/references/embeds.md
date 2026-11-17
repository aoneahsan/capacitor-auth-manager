# Live product embeds

Owner directive 2026-08-01: when a page references one of our own products, show the **running product**, not
a screenshot. A screenshot is stale the day after it is taken and cannot be tried; a live embed is the same
argument as a playground, applied to a whole product.

Applies to cross-promotion sections, portfolio and case-study pages, docs demonstrating a sibling tool, and
the click dummy's own home page when it names another product. Roster of what we ship:
`~/.claude/rules/ecosystem-products.json`.

## 🔴 Probe the target before designing the section

Framing is refused by the **target**, not by us, and the refusal renders as an empty box — worse than the
screenshot it replaced. One command, before any markup:

```bash
curl -sS -I -m 10 https://<product-host> | grep -iE 'x-frame-options|content-security-policy'
```

Measured across our own products on 2026-08-01:

| Host | Result |
|---|---|
| `trizlink.com` · `aoneahsan.com` · `ztools.zaions.com` · `fileshub.zaions.com` · `nativeupdate.aoneahsan.com` | no `X-Frame-Options`, no `frame-ancestors` → **frames** |
| `notebook.aoneahsan.com` | `X-Frame-Options: DENY` **and** a CSP `frame-ancestors` → **refuses**, correctly — it is private and auth-gated |

So most of ours embed today, and the one that refuses is the one that must. **Re-probe rather than trusting
this table** — a header can be added by a hosting change nobody announced.

### Two things the probe does not prove

🔴 **A missing header is not proof the embed works.** Three failures survive a clean probe:

- **Our own CSP.** The embedding page needs the target in its `frame-src`. A page with a strict CSP blocks its
  own iframe, and the console error names our page, not theirs.
- **A cookie-authenticated product renders signed-out.** Third-party cookies in an iframe are blocked or
  `SameSite`-partitioned in every current browser, so a framed app shows its logged-out shell. That is often
  fine — the signed-out marketing view is what you wanted — but decide it, rather than discovering it.
- **A framed app may be unusable at the embed's width.** Ours are responsive to 320px, so this is usually a
  question of choosing a sensible box, not a blocker.

🔴 **Never frame an auth-gated surface** — a dashboard, an admin panel, anything behind sign-in. It will show
a login form inside your marketing page, which reads as broken.

## The contract

```html
<figure class="embed" style="--embed-ratio: 16 / 10">
  <iframe
    src="https://trizlink.com/?utm_source=<this-product>&utm_medium=embed"
    title="Trizlink — link shortening, running live"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
  ></iframe>
  <figcaption>
    <a href="https://trizlink.com" target="_blank" rel="noopener">Open Trizlink in a new tab ↗</a>
  </figcaption>
</figure>
```

```css
.embed { container-type: inline-size; }
.embed > iframe {
  /* the ratio box is not styling — it reserves the space before load, so the
     embed cannot shift the page. Same concern as a skeleton. */
  aspect-ratio: var(--embed-ratio, 16 / 10);
  inline-size: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);   /* something to see while it loads */
}
```

| Attribute | Why it is not optional |
|---|---|
| `loading="lazy"` | an embed below the fold must not cost a full app boot on first paint |
| `title` | the iframe's accessible name; without it a screen reader announces "frame" |
| `aspect-ratio` box | reserves the space, so the embed cannot cause layout shift |
| `sandbox` | least privilege. Drop `allow-same-origin` if the product does not need storage — but note that keeping both `allow-scripts` and `allow-same-origin` for a **same-origin** target lets it remove its own sandbox, so it is only meaningful cross-origin |
| the visible link | 🔴 **the fallback.** Present always, not only on failure — a blocked frame gives no error a page can catch, so the link is the only thing standing between the reader and a blank rectangle |
| `utm_source` | the embed is a real referral surface; attribute it |

## Weight

An embed boots an entire application. **One live embed per page** — a cross-promo grid of ten products gets
ten cards with real SVG logos and links, plus at most one embedded flagship. Beyond that the page's own
metrics are somebody else's app.

If the section needs several, embed on interaction: render the card, and swap in the iframe on click. That
also removes the third-party boot from the page's initial load entirely.

## Reduced motion, and what an embed must never do

The embedded product runs its own animation and reads the viewer's own OS preference — do not try to reach
into it. What our page owes: never autoplay audio from an embed, never let it be the only route to the
information, and never place one where it can push a control the reader is about to press
(`aoneahsan-cccs-motion`).

## In a click dummy

A dummy opens over `file://`, where an `https://` iframe still loads — but it is slow, needs a network, and
makes an offline review impossible. Ship a **static placeholder card at the real embed's exact ratio box**,
labelled as standing in for the live embed, so the layout is specified without the dependency, and note it in
the delivery summary. The real iframe lands in the framework build.

**Last updated:** 2026-08-01 (created; framing headers probed live across six of our own hosts)
