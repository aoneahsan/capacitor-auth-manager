# Search Console: "Couldn't fetch" / "Sitemap could not be read"

A runbook. Every check either finds a defect of ours or clears it. Once every check passes, the status is
Google's schedule, and the work is to prove that and raise crawl demand. Resubmitting does neither.

## What the status means

- **Google's Sitemaps report help** (support.google.com/webmasters/answer/7451001) lists these causes:
  - the sitemap is blocked by robots.txt;
  - the site has a manual action;
  - the sitemap URL is wrong (404);
  - general server problems, which may be transient;
  - **low crawl demand for the sitemap**.

  After a failed fetch Google "will retry for a few days", then stops. The fix it names is "fix the problem and
  resubmit your sitemap with a new request".
- **Mueller, Search Off the Record #114, "Do sitemaps still matter?"** (2026-10-01; SEJ, 2026-10-06): a valid
  sitemap also shows "Couldn't fetch" when Google is too busy to fetch it (host load), or when crawl demand is low,
  and "the crawl demand is very often based on the perceived quality of a website". On the same episode:
  - Google uses lastmod only when the dates look reasonable;
  - changefreq and priority are dropped;
  - AI crawlers request `/sitemap.xml` and RSS, so keep the generic names;
  - llms.txt cannot replace a sitemap.
- **The signature of "not fetched yet" or low demand:**
  - type **Unknown**, 0 discovered pages;
  - an empty "Last read" in the table;
  - no specific error under "Sitemap could not be read".

  It is typical of a host published days or hours before the submission.

## Checks, in order: the first failure is ours

Run them as Googlebot smartphone where a user agent matters:
`UA='Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'`.

1. **The live audit** (`verification.md`): the sitemap answers 200, as XML, with no redirect, no BOM and a valid
   `urlset`. Every `<loc>` answers 200, names itself as canonical and is indexable. The robots line is present,
   and an unknown path answers 404.
2. **robots.txt**:
   - it answers 200. A 5xx or a timeout on robots.txt makes Google pause crawling the whole host;
   - the sitemap path is not disallowed;
   - the `Sitemap:` line is absolute.
3. **DNS as Google resolves it**:
   - `curl -s "https://dns.google/resolve?name=<host>&type=A"`, then `AAAA` and `CNAME`. Expect `"Status":0` with
     answers.
   - `Status: 2` (SERVFAIL) while your own resolver answers is usually a broken DNSSEC chain at the registrar.
4. **TLS**:
   - `curl -sSI https://<host>/sitemap.xml` passes without `-k`;
   - a certificate issued minutes before the submission can be the whole story (GitHub Pages: Enforce HTTPS on,
     certificate approved);
   - if this machine has IPv6, `curl -6` the same URL.
5. **Edge protection**: a Cloudflare zone's Bot Fight Mode, "Block AI bots" or a WAF rule can answer a crawler
   with 403 or a challenge page.
   - Fetch with the Googlebot UA and compare with a browser's.
   - Verified Googlebot passes Cloudflare's bot list; a challenge on the sitemap path does not.
6. **The single-page-app fallback**: `/sitemap.xml` answered with `index.html` (`text/html`), because the file is
   missing from the deployed output or a rewrite catches it first.
7. **The property**: the sitemap URL must lie inside the property it is submitted to. A Domain property covers every
   subdomain; a URL-prefix property only its own prefix.
8. **Google's own fetch** (the proof):
   - The owner runs Search Console → URL Inspection → paste the sitemap URL → **Test live URL** → Page availability.
   - "Page fetch: Successful" and "Crawl allowed: Yes" mean the file is fine.
   - Never press "Request indexing" on a sitemap; it is not a page.
   - Without console access, Google's Rich Results Test fetches any URL from Google's network, as a best-effort
     second view. It may be captcha-gated.

## When every check passes

**Do:**
- **Once the live test passes,** remove the sitemap in the Sitemaps report and add it again once: a new request.
- **Request indexing** for the host's home page and one or two key pages. A crawl of the host raises its demand.
- **Link the new host from the established one:**
  - the footer;
  - a `/sitemap` card;
  - a `## Docs` section in `llms.txt`;
  - the new host's sitemap as a second `Sitemap:` line in the established host's `robots.txt`.
- **Submit to Bing** Webmaster Tools (import from Search Console), and send changed URLs by IndexNow (Bing, Yandex).
- **Wait.** On a new host, days.
- **Record:**
  - the owner's steps as a `docs/MANUAL-TASKS.md` row;
  - the property, the submissions and the status in `docs/seo-verification.md`.

**Don't:**
- resubmit the same URL again and again (nothing changes);
- rename the sitemap file (an old workaround that breaks the `/sitemap.xml` convention AI crawlers rely on);
- call `google.com/ping?sitemap=` (retired in 2023; it answers 404);
- stamp today's date on every lastmod to look fresh;
- claim the status is fixed before Search Console says Success.

## First case

**Rent Party docs** (`rentparty-docs.aoneahsan.com`, GitHub Pages, 2026-10-12):
- The host was published that morning, and the sitemap was submitted the same day in the `aoneahsan.com` Domain
  property.
- Every check passed.
- The same audit found the sibling game host (Cloudflare Pages) answering unknown paths with 200 (soft 404s, no
  `404.html`), and `<lastmod>` missing on 6 of its 14 URLs. Both were fixed (that project's D-173).
