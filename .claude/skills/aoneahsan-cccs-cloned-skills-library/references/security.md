# Vetting a cloned skill before it enters a project

**Last Updated:** 2026-07-27

A skill is not data — it is **instructions an agent will follow**, in a folder that may also ship executable
files. Copying one into a project is closer to adding a dependency than to copying a document.

## Why this file exists

Snyk's **ToxicSkills** research audited 3,984 Agent Skills from ClawHub and found **13.4 % (534) carried at
least one critical-severity issue**, with 36.82 % affected at some severity. Of the confirmed-malicious
skills, **100 % contained malicious code patterns and 91 % also carried prompt injection** — the injection
primes the agent to accept the payload that its own safety training would otherwise refuse. Four threat
actors were identified, one of whom published 40+ skills generated from a single attack template.

The companion article on `SKILL.md` shell access adds the mechanism: agents run **unsandboxed by default**,
so a natural-language instruction is already a shell command, and a skill folder can also carry
`install.sh`-style payloads, unpinned package references, and writes to persistent memory files that survive
into every later session.

**This library holds 2,147 distinct skills across 13 repos, 1,894 of them from a single unvetted aggregator.
That is the ClawHub shape exactly.**

## The eight attack classes (ToxicSkills taxonomy)

Prompt injection · malicious code · suspicious downloads · credential-handling defects · hardcoded secrets ·
third-party content exposure · unverifiable dependencies (`curl | bash`) · direct money access.

## Red flags — any one of these stops the copy

- Obfuscated commands: `base64 -d`, hex escapes, Unicode smuggling, `eval(atob(...))`
- Remote script execution: `curl … | bash`, `wget … | sh`, or an unpinned installer
- Password-protected archives in prerequisites (defeats automated scanning)
- Hardcoded secrets, or instructions to **echo/print** an API key
- Runtime fetching from an endpoint the skill controls
- Instructions to disable a security warning, or DAN/"developer mode" jailbreak language
- Typosquatted names imitating a well-known tool
- Writes to `MEMORY.md`, `SOUL.md`, `CLAUDE.md` or any persistent-state file — that is persistence, not setup

## The checklist — run before every copy

1. **Read the whole `SKILL.md`.** Not the description; the body. If it is too long to read, it is too long
   to trust.
2. **List the folder.** `find <skill-dir> -type f | sed 's|.*/||' | sort | uniq -c` — anything executable
   gets read too, or gets dropped from the copy.
3. **Check the trust tier** in `CATALOG.json`. `quarantined` and `excluded-by-policy` never proceed
   automatically.
4. **Run the red-flag scan** (below) over that one folder.
5. **Confirm what it reaches.** Network calls, env vars, and file writes outside the project are all
   disclosed to the owner before copying — not discovered later.
6. **Prefer dropping over trusting.** Most of these skills are valuable for their *prose*. If a bundled
   script is not needed, copy the Markdown and leave the script behind.
7. 🔴 **Scan for IRON-banned COMMANDS, not only for malice.** A skill can be entirely benign and still tell
   an agent to do something this fleet forbids — that is the common case, not the rare one, because upstream
   authors have never read these rules. Run the banned-command scan below and neutralise every hit **in the
   copy**.

### 🔴 A precondition check is not a fix — the half-fix trap (added 2026-08-14)

Found on clearhire, by the standalone review of the very commit that copied the skills.

Three skills were copied and each launched a browser. The fixup added a guard to two of them:

```bash
[ -x "$CHROME_WS_BROWSER" ] || { echo "refusing"; exit 1; }   # then left the original launch intact
```

That guard **refuses when the variable is unset — which is never the case on a configured machine — and
changes nothing when it is set.** The skill still ran `npx @accesslint/chrome ensure`, which resolves the
**system** Chrome: the exact act `browser-automation.md` prohibits. The commit message said all three now
refuse rather than fall back. It was true of one.

**The rule: re-point the launch itself, then grep the copy for the old invocation and confirm it is gone.**
Checking a precondition and leaving the offending call underneath is the shape to watch for, and it reads as
fixed in review unless someone runs the block.

The same review found `git stash push -u` / `git stash pop 2>/dev/null` still live in another copied skill —
banned by name in `git-workflow.md`, *including* its stated "just for a moment while measuring a baseline"
case. Neither is a security defect. Both would have caused real damage.

### The banned-command scan — run over every copy

```bash
S=<skill-dir>
grep -rnE "git stash" "$S"                                   # BANNED outright - rewrite to git worktree add
grep -rnE "supabase (db reset|start|stop|status)|127\.0\.0\.1:543" "$S"   # BANNED - dev IS prod
grep -rnE "/usr/bin/(google-)?chrom|Google Chrome\.app|chromium\.launch\(|puppeteer\.launch\(|executablePath" "$S"
grep -rnE "(yarn|npm|pnpm) (run )?(dev|start|preview|serve)|--watch" "$S"  # dev servers: run-to-verify only
grep -rnE "\bpython\b(?![0-9])" "$S"                         # this machine has python3 ONLY
grep -rnE "2>/dev/null" "$S"                                 # never suppress output a later step depends on
```

Every hit is neutralised in the copy and **recorded as a fixup** in the project's `EXTERNAL-SKILLS.md`, so a
re-sync re-applies it. An unrecorded fixup is silently lost the next time the source is pulled.

### The scan, as direct commands

```bash
S=<skill-dir>
grep -rnE "curl[^|]*\|[[:space:]]*(sudo )?(ba)?sh|wget[^|]*\|[[:space:]]*(ba)?sh" "$S"
grep -rnE "base64 (-d|--decode)|eval\(atob|atob\(" "$S"
grep -rnE "(cat|read).{0,40}(\.aws/credentials|\.ssh/id_|\.env).{0,60}(curl|http|fetch)" "$S"
grep -rnE "MEMORY\.md|SOUL\.md|CLAUDE\.md|\.bashrc|\.zshrc" "$S"
find "$S" -type f \( -name '*.sh' -o -name '*.py' -o -name '*.js' -o -name '*.cjs' -o -name '*.mjs' \)
```

A hit is not a verdict — it is a **read-this-line trigger**. Security-training and cloud-CLI skills
legitimately discuss `base64`.

## Scan results — 2026-07-27, whole library

Run across all 13 repos at the commits pinned in `sources.json`:

| Check | Result |
|---|---|
| Credential-exfiltration (`~/.aws`, `~/.ssh`, `.env` → network) | **0 matches** |
| `curl \| bash` / `wget \| sh` | 21 files, **all reviewed as legitimate** — installer docs (rclone, MCP setup, Next.js deployment) and the aggregator's own security-guardrails documentation |
| `base64 -d` / `atob` | 15 files, **all reviewed as legitimate** — security-training skills (XSS, privilege escalation), AWS CLI docs, secrets-rotation guides |
| Bundled executable files | **2,675** across the library; per-skill counts recorded in `CATALOG.json` |
| Skills declaring `allowed-tools` | 281 (an experimental field; house skills never use it) |

**This is a point-in-time result on pinned commits, not a clearance.** `git pull` invalidates it. Re-run the
scan and re-date this section whenever a repo is updated or a new one is cloned.

## The quarantine rule

`agentic-awesome-skills` (1,894 skills) is **`quarantined`**. It is indexed in `quarantined-index.txt` so a
skill can be found, and it is **never proposed and never auto-copied**. To use one, the owner names it
explicitly, and the full checklist above runs on that single folder first. Promote it into the trusted set
only after it passes.

`agent-skills` (sleek) is **`excluded-by-policy`** — not for security but because it requires a paid
`SLEEK_API_KEY` ($49.99/month), which the zero-cost rule forbids. Do not propose it.

## After copying

The copy is a **fork, not a subscription** — it never auto-updates, which is the point. Record the source
commit in the project's `.claude/skills/EXTERNAL-SKILLS.md` so a later re-sync is a deliberate, re-vetted
act.

## Related

`aoneahsan-cccs-cloned-skills-library` (the copier) · `~/.claude/rules/zero-cost.md` ·
`_source-understanding/urls/` for the two Snyk source records.
