# Cloudflare One / Zero Trust — essentials

Rare-use, high-stakes knowledge, compressed. **Retrieval-first**: before citing limits, category IDs, API
fields, or UI paths, fetch the current docs at `https://developers.cloudflare.com/cloudflare-one/` (or the
Cloudflare docs MCP / API schema). Stage risky changes disabled or scoped to a pilot group unless the owner
says otherwise.

## The products

| Product | Does |
|---|---|
| **Access** | Identity-aware authorization for apps (web, SSH/RDP, SaaS SSO). Clientless for public hostnames; device-client + routes for private destinations |
| **Gateway** | Secure web gateway — DNS/HTTP/L4 filtering, TLS inspection, DLP |
| **WARP / device client** | Enrolls devices; carries identity + posture into Gateway/Access policies |
| **Tunnel (`cloudflared`)** | Off-ramp from a private network to Cloudflare (no inbound ports). Prefer remotely-managed/token tunnels for new deployments |
| **Cloudflare WAN / Mesh** | Site-to-site + on/off-ramp connectivity |
| **DLP / CASB / device posture** | Data-loss policies · SaaS misconfig findings · device health checks feeding policy |

## Workflow

1. **Classify** the ask: architecture, configuration, troubleshooting, migration, or review.
2. **Gather context:** account, users/sites/apps, IdP + SCIM/group sync, device management, traffic path,
   compliance, rollout blast radius.
3. **Retrieve** only the docs for the products involved.
4. **Inspect existing resources** before changing anything (Access apps/policies/groups/IdPs, Gateway
   rules/lists, tunnels/routes, device profiles).
5. **Propose** the change set with prerequisites, validation, and rollback; stage risky changes to a pilot.

## Guardrails

- Access = app authorization; Gateway = traffic inspection/filtering. Use both when the need spans both.
- Public-hostname Access apps can be clientless; private destinations need WARP/device client + routes + DNS.
- Group-based policies depend on IdP group claims or SCIM — if group sync is missing, don't invent group
  selectors.
- Tunnel is an off-ramp; WAN/Mesh are on/off-ramps.

## Migrations (Zscaler ZIA/ZPA, Palo Alto, legacy VPN → Cloudflare One)

Do a parity/gap assessment first: map source policies to Access/Gateway equivalents, identify gaps, plan a
staged rollout (pilot → phased → cutover) with a rollback path. Retrieve both Cloudflare's migration docs and
the source vendor's export docs before generating exact configuration — never hand-translate policy from
memory.
