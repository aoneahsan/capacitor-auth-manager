# Overview — `aoneahsan-cccs-cloudflare-platform`

## Purpose

Covers the Cloudflare platform outside Worker code — hosting, DNS/TLS, CDN, security, Turnstile, and Zero
Trust — keeping the retrieval-first stance of the source skills while enforcing the owner's zero-cost line and,
critically, the rule that outbound email is FilesHub rather than Cloudflare Email Service.

## What this skill does

- Routes platform needs to the right product: Pages, DNS/TLS, cache, WAF/DDoS/bots, Turnstile, Cloudflare One.
- Makes Turnstile the CAPTCHA of record and gives its end-to-end setup flow (no script files).
- Redirects outbound email to FilesHub; CF Email Service applies only when the owner names it.
- Compresses Cloudflare One / Zero Trust into an assessment-first reference for rare-use work.
- Keeps DNS/plan/billing changes owner-only.

## When it gets invoked

- "host this site", "point the domain", "set up TLS/CDN/cache".
- "add a CAPTCHA / stop bot signups / protect this form" (Turnstile).
- WAF/DDoS/bot questions; Access/Gateway/Tunnel/Zero-Trust design or migration.

## Where it applies

| Scope | Applies |
|---|---|
| Project types | Any project hosted on or fronted by Cloudflare; Firebase-Hosting projects keep Firebase. |
| Stack override | The platform concern; apply the chosen host's equivalent where a project isn't on Cloudflare. |

## Sources

| Source | Record |
|---|---|
| cloudflare (non-Workers), turnstile-spin, cloudflare-email-service, cloudflare-one, cloudflare-one-migrations (Cloudflare, retrieval-first) | folded 2026-07-23; navigation + Turnstile flow kept, docs not reproduced |
| owner rules (zero-cost, FilesHub-mandatory, services-integrations) | baked in (pointers, not copies) |

## Related skills

- `aoneahsan-cccs-cloudflare-workers` — Worker code, including Turnstile's siteverify endpoint.
- `aoneahsan-cccs-fileshub` — the mandatory email + file-storage provider.
- `aoneahsan-cccs-firebase` — the Hosting alternative many projects use.

## Maintenance

- **Living registries this skill points at:** `~/.claude/rules/zero-cost.md`, `fileshub-api.md`,
  `services-integrations.md`.
- **Last reviewed:** 2026-07-23
