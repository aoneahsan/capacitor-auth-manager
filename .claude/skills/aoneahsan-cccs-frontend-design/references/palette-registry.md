# Per-project colour palette registry

## Why a registry

The owner's rule: *"we must not repeat colors for our projects… we must design each and every project with a
unique color pallet and define it at start of project and make sure like we store/confirm unique ports for
each projects we do this as well for each project with a global config."*

The dev-port registry is the working model — a single global file, consulted before claiming, never
overwritten by a later project.

## Location

Alongside the port registry under `~/.claude/ports/`, as `~/.claude/palettes/project-palettes.json`
(symlinked into the notebook like every other global record). If it does not exist yet, create it on the
first project that needs a palette and record the location in the project's `CLAUDE.md`.

## Format

```jsonc
{
  "description": "One unique palette per project. Read before claiming. Never reassign a claimed hue.",
  "lastUpdated": "YYYY-MM-DD",
  "projects": [
    {
      "project": "ztools",
      "domain": "ztools.zaions.com",
      "primaryHue": 262,               // oklch hue angle — the uniqueness key
      "accent": "violet",
      "accentToken": "oklch(0.541 0.281 293)",
      "supporting": ["slate", "emerald"],
      "displayFont": "…",
      "bodyFont": "system-ui",
      "claimedAt": "YYYY-MM-DD"
    }
  ]
}
```

**`primaryHue` is the registry key, not a complete visual identity.** Prefer at least 25° between claimed
primaries when the current registry permits it. When no candidate has that clearance, find the hue with the
greatest minimum circular distance from every existing claim **within the product's semantic constraints**.
Record that measured distance and the nearest claims. Then distinguish the product through chroma, lightness,
neutral temperature, typography, and visual treatment. A new entry must still have a different `primaryHue`
and a palette that reads as made for that product. Never move another project's claim to create room.

This is a capacity rule, not an exception: 26 claimed primaries already occupy a 360° wheel, so a universal
25° clearance is mathematically unavailable. Recompute the gaps from the remote registry for each new claim;
do not assume that a previously free midpoint is still free.

### 🔴 One colour space, always — `primaryHue` is OKLCH, never HSL

A hue number is meaningless without its space. The same colour is **HSL 173** and **OKLCH 184.7**; comparing
one against the other silently corrupts every separation check.

**This is not hypothetical.** The registry stored HSL hues while this spec compared OKLCH, and the mismatch
hid a real collision for months:

| | hex | HSL hue | **OKLCH hue** |
|---|---|---|---|
| LifeWell | `#14b8a6` | 173.4 | **182.5** |
| SNGDC | `#0D9488` | 174.7 | **184.7** |

**2.2° apart** — the same teal to anyone looking, on two shipped products, while the stored numbers looked
fine. Converted on 2026-07-27; legacy values are kept in `legacyHslHue` for provenance only.

**So: convert every candidate and every claimed entry to OKLCH before measuring separation.** Derive the hue
from the hex rather than trusting a stored number whose space you cannot verify.

## Choosing a palette

1. **Read the registry — the REMOTE copy, not the file on disk.** 🔴 `git fetch` alone is **not** enough: it
   updates remote-tracking refs and leaves your working tree exactly as stale as it was. Read the remote blob
   itself:

   ```bash
   REPO="$(git -C "$(dirname "$(readlink -f ~/.claude/palettes)")" rev-parse --show-toplevel)"
   git -C "$REPO" fetch -q
   git -C "$REPO" show '@{u}':static/assets/claude-code/palettes/project-palettes.json
   ```

   (`git -C "$REPO" pull --ff-only` also works and is simpler, but it touches the tree, so it can fail on
   unrelated local edits — and this repo usually has some.) See the parallel-writer note below.
2. **Pick a primary that fits the product's temperature** — calm/analytical toward blue-teal, energetic toward
   orange-red, premium toward violet-indigo, natural toward green.
3. **Generate the 50→950 ramp in `oklch`**, holding hue roughly constant and varying lightness evenly. Reduce
   chroma at the extremes or 50 and 950 look muddy.
4. **Check contrast before committing** — the accent must reach 4.5:1 against its intended text colour at the
   shade you will actually use for buttons and links. A beautiful accent that fails contrast becomes a
   different accent later.
5. **Choose supporting neutrals** with a slight tint of the primary rather than pure grey; it is what makes a
   palette read as designed rather than defaulted.
6. **Claim it** — **re-fetch, then** add the row, bump `lastUpdated`, and record the palette in the project's
   `CLAUDE.md`. Steps 2–5 take real time, and the registry can move underneath them.

## 🔴 The registry has parallel writers on other machines

The file lives in `ahsan-notebook` and is written from **every machine the owner works on**. It is not a local
file that happens to be versioned — it is a shared registry reached through a symlink, and `git` is its only
concurrency control. So a plain read tells you what your last pull knew, which may be days old.

**Both halves are load-bearing, and the second is the one that gets skipped:** read the **remote blob**
before you decide (step 1 — a bare `fetch` does not change what the file on disk says), and fetch again
immediately before you *write*.

Failure this describes, aoneahsan.com 2026-08-13 — the recoverable version of it. A session read the registry
from a checkout **72 commits behind**, found six projects and no row for its own, and concluded the hue had
gone unclaimed for ten days. It wrote a duplicate row, and prepared to raise two "collisions" with the owner
as new findings. The remote had held the correct entry since the day the hue was chosen — richer, with the
real brand accent, and already recording that the two alternates were *deliberately* free to overlap. **So the
finding was invented, the collisions were a settled decision, and the only thing that surfaced it was a merge
conflict.** Had the two edits touched different lines, git would have merged them silently and the registry
would now hold two rows for one project.

**The unrecoverable version is the same mistake one step earlier:** read a stale registry, see a free arc that
another machine claimed yesterday, and ship a whole project on a colliding hue. Nothing conflicts, nothing
errors, and the fleet quietly has two products wearing one identity.

> This note is also the standing text that `project-palettes.json` has been citing — **one** row (trizlink)
> referred to a "parallel-writer warning" that, until 2026-08-13, existed nowhere. If you arrived here from
> that reference, this is it.

## Verifying uniqueness

```bash
python3 -c "
import json;d=json.load(open('$HOME/.claude/palettes/project-palettes.json'))
hues=sorted((p['primaryHue'],p['project']) for p in d['projects'])
print('claimed:', hues)
gaps=[(b[0]-a[0], a[1], b[1]) for a,b in zip(hues, hues[1:])]
print('widest gap:', max(gaps) if gaps else 'none')"
```

## What is NOT in the registry

Per-user theme choices. The registry fixes the project's *identity*; the theme customiser lets each user pick
their own accent within it — see `aoneahsan-cccs-react-theming`. The two are different layers, and the
customiser must never be constrained to the registry value.
