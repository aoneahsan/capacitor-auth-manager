---
name: aoneahsan-cccs-cloudflare-platform
description: 'Cloudflare work outside Workers code: Pages hosting, DNS, domains and TLS, CDN and cache, WAF/DDoS/bot protection, Turnstile CAPTCHA, and Zero Trust (Access, Gateway, Tunnel). Retrieval-first. Covers the zero-cost line and the FilesHub-is-mandatory-email rule. Use when hosting on Pages, configuring DNS, TLS, cache or WAF, adding Turnstile, or setting up Zero Trust.'
metadata:
  source: cloudflare (non-Workers) + turnstile-spin + cloudflare-email-service + cloudflare-one + cloudflare-one-migrations (Cloudflare, retrieval-first), adapted with the owner's zero-cost + FilesHub rules
---

# Cloudflare Platform

## Overview

The Cloudflare platform beyond Worker code: static hosting (Pages), DNS/TLS, CDN/cache, security
(WAF/DDoS/bots/Turnstile), and Zero Trust (Access/Gateway/Tunnel). Your knowledge of limits, categories, and
UI paths drifts — **retrieve current Cloudflare docs** before citing specifics.

**The standard:** free tier only; Turnstile is the CAPTCHA of record; and **email is FilesHub, not Cloudflare
Email Service** — CF email is used only when the owner explicitly names it.

## When to use

- Hosting a static site/SPA (Pages), DNS records, a custom domain + TLS, cache rules.
- Protecting a form from bots (Turnstile), or WAF/DDoS/bot-management questions.
- Zero Trust / Cloudflare One: Access apps, Gateway policies, Tunnels — or migrating off Zscaler/PAN/VPN.

**Not for:** Worker code, Durable Objects, Queues, storage bindings → `aoneahsan-cccs-cloudflare-workers`.
Email + file storage → `aoneahsan-cccs-fileshub` (mandatory). 🔴 Firebase Hosting projects migrate to Pages (owner, 2026-11-05, `~/.claude/rules/cloudflare-hosting.md`; firebase.json porting, `www` on every hostname and DNS moves live in its detail).

## Owner rules

- **Free tier only** — no paid Cloudflare plan, no usage billing.
- **🔴 Email = FilesHub.** Cloudflare Email Service (Sending/Routing) is used ONLY when the owner names it for
  that project. Default outbound email and file storage go through FilesHub (`~/.claude/rules/fileshub-api.md`).
- **Turnstile is the CAPTCHA** whenever bot protection is needed — never a paid CAPTCHA or a hand-rolled one.
- **Plan/billing changes and a domain's nameserver change are owner-only.** DNS records on a zone already on Cloudflare are routine.

## Retrieval sources

| Source | Use for |
|---|---|
| `https://developers.cloudflare.com/` + the `cloudflare-docs` search | limits, pricing, API, categories, UI paths |
| `https://developers.cloudflare.com/turnstile/` | Turnstile widget modes, siteverify contract |
| `https://developers.cloudflare.com/cloudflare-one/` | Access/Gateway/Tunnel config + API schema |

When a reference here disagrees with the docs, **trust the docs**.

## Quick reference

| Need | Product |
|---|---|
| Host a static site/SPA with Git deploys | Pages, always |
| DNS records, custom domain, TLS | DNS + Cloudflare-managed certs |
| CDN / cache tuning | Cache Rules, Cache Reserve |
| CAPTCHA / stop bot signups | **Turnstile** (`references/turnstile.md`) |
| WAF / DDoS / bot management | WAF managed rulesets · DDoS (auto) · Bot Management |
| Identity-aware app access, secure web gateway, private networking | Cloudflare One — Access / Gateway / Tunnel (`references/cloudflare-one.md`) |
| Transactional email | **FilesHub** — not CF Email Service (`references/email-service.md`) |

## Common mistakes

| Mistake | Instead |
|---|---|
| Wiring Cloudflare Email Service for outbound mail | FilesHub, unless the owner named CF email for this project |
| A paid CAPTCHA or hand-rolled bot check | Turnstile (managed mode) |
| Auto-changing nameservers/plan/billing | Owner-only — pause and ask |
| Trusting pre-trained Gateway categories / limits | Retrieve current docs first |
| 🔴 `wrangler pages project create` run **inside** a project (wrangler 4.13x, found 2026-09-11 on ztools) — it auto-configures the repo (edits `vite.config.ts`, `package.json` scripts + devDeps, `yarn.lock`, `.gitignore` incl. `.env*`, writes `wrangler.jsonc`) and deploys a **Worker**, not Pages | Create the Pages project through the REST API (`POST /accounts/{id}/pages/projects {"name","production_branch"}`), then `wrangler pages deploy <absolute dist> --project-name <p> --branch main` from **outside** the repo; `git status` after every wrangler call |
| A Worker (or Workers static assets) for a subdomain whose DNS lives elsewhere (e.g. Hostinger) | Workers custom domains need the zone on Cloudflare. Classic **Pages** takes an external CNAME `<sub>` → `<project>.pages.dev` — attach the domain first (`POST …/pages/projects/<p>/domains`), then the owner adds the CNAME |

## Going deeper

- `references/turnstile.md` — end-to-end Turnstile setup (widget, siteverify Worker, frontend, validation) —
  the flow distilled, no script files.
- `references/email-service.md` — why FilesHub is the default and when CF Email Service applies.
- `references/cloudflare-one.md` — Zero Trust essentials (Access/Gateway/Tunnel) + migration assessment,
  compressed (rare-use knowledge).

## Related skills

`aoneahsan-cccs-cloudflare-workers` (the Worker side — Turnstile's siteverify runs there) ·
`aoneahsan-cccs-fileshub` (email + storage) · `aoneahsan-cccs-firebase` (Hosting alternative) ·
`aoneahsan-cccs-react-seo` (a Pages-hosted SPA's crawlability).

<!-- Living registries (link, never copy): ~/.claude/rules/zero-cost.md, fileshub-api.md, services-integrations.md when present. -->
