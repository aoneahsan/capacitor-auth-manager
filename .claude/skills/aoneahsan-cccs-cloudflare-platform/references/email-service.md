# Email on Cloudflare — and why FilesHub is the default

## 🔴 The rule first

**Outbound email and file storage in every project go through FilesHub, not Cloudflare Email Service.** Use
Cloudflare Email Sending/Routing ONLY when the owner explicitly names it for a specific project. This mirrors
the FilesHub-is-mandatory rule (`~/.claude/rules/fileshub-api.md`); do not wire CF email "because it's
convenient in a Worker."

So: for transactional mail (welcome, contact form, notifications), reach for `aoneahsan-cccs-fileshub`, not
this page.

## When CF Email Service does apply (owner named it)

Cloudflare Email Service (launched 2025, evolving — retrieve current docs at
`https://developers.cloudflare.com/email-service/`) has two halves:

- **Email Sending** — send transactional mail. From a Worker, the `send_email` binding needs no API keys:
  ```jsonc
  // wrangler.jsonc
  { "send_email": [{ "name": "EMAIL" }] }
  ```
  ```ts
  await env.EMAIL.send({ to, from: { email: "welcome@yourdomain.com", name }, subject, html, text });
  ```
  The `from` domain must be onboarded first: `npx wrangler email sending enable yourdomain.com`. From
  outside Workers, use the REST API with a Bearer token.
- **Email Routing** — receive/route inbound mail via a Worker `email()` handler (parse with `postal-mime`).

## Prerequisites (if used)

1. Domain onboarded: `npx wrangler email sending list` → `enable <domain>` if absent.
2. Binding present in `wrangler.jsonc` (`send_email`).
3. `postal-mime` installed only for receiving/parsing.
4. Deliverability: SPF/DKIM/DMARC configured — retrieve the current deliverability guide.

## Bottom line

Default = FilesHub. This page exists so that, on the rare project where the owner chooses Cloudflare email,
the setup is known — not to make CF email the norm.
