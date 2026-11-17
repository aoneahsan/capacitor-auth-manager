---
name: aoneahsan-cccs-typescript
description: 'TypeScript configuration and typing: the TS6 version pin and why it exists, tsconfig settings including the TS7-forward-compatible path migration, strictness that catches bugs without theatre, and the any/unknown rule. Use when configuring tsconfig, upgrading TypeScript, typing an API boundary, or when the compiler fights you.'
metadata:
  author: aoneahsan
  source: custom-skills/_source-understanding/files/generic-project-rules.md
---

# TypeScript

## 🔴 Stay on TypeScript 6

**Pin `typescript ~6.0.3`.** TypeScript 7.0.x is the native Go port and ships essentially no JS API, which
breaks two things we cannot drop:

- **`typescript-eslint`** — its parser reads a removed API and crashes at module load
  (`TypeError: Cannot read properties of undefined (reading 'Cjs')`). No config works around it; `yarn lint`
  is simply dead. Its peer range still reads `>=4.8.4 <6.1.0`, so **TS 6.1+ is equally unusable**, not just 7.
- **`@capacitor/cli`** — it transpiles `capacitor.config.ts` through that same API, so `cap sync` fails.

Live check before assuming this has changed:

```bash
npm view @typescript-eslint/typescript-estree@latest peerDependencies.typescript
```

The canonical ledger is `~/.claude/rules/package-version-known-issues.md` — read it, don't restate it.

## Do the TS7-ready tsconfig migration now

These changes work identically under TS6 and are required by TS7, so applying them once costs nothing:

```jsonc
{
  "compilerOptions": {
    // ❌ "baseUrl": ".",              // removed in TS7
    "paths": { "@/*": ["./src/*"] },   // relative targets — valid in both
    // ❌ "ignoreDeprecations": "..."  // drop it
    "strict": true,
    "sourceMap": false,                // never ship source maps
    "declarationMap": false,
    "inlineSourceMap": false
  }
}
```

## Strictness that catches bugs, not theatre

- **`strict: true`**, but not every experimental strictness flag. The goal is real defects.
- **`any` is banned. `unknown` is the escape hatch** — it forces a narrowing decision at the boundary instead
  of erasing it everywhere downstream.
- **Type the boundary, infer the interior.** Annotate exported functions, API responses and props; let
  inference do the rest. Over-annotating internals adds noise and drifts from reality.
- **Derive, don't duplicate.** `z.infer<typeof schema>` for validated shapes, `ReturnType`, `Parameters`,
  `keyof` and indexed access instead of a hand-maintained parallel type. A type written twice will disagree
  eventually.
- **Discriminated unions over optional-field soups.** `{ status: 'loading' } | { status: 'ready'; data: T }`
  makes the impossible state unrepresentable; `{ loading?: boolean; data?: T }` does not.

## Source maps stay off

Production output ships **no** `.map` files and no `//# sourceMappingURL`. Dev-only inline maps are fine. Do
not let a Sentry-upload toggle switch them back on by default.

## When the compiler fights you

Ask which of three cases it is: the types are **right and the code is wrong** (fix the code); the types are
**wrong** (fix the type, at the boundary, once); or the checker cannot see what you can (narrow explicitly, or
assert **with a comment saying why it is safe**). A cast with no explanation is a bug with a delay on it.

For the ESLint pairing and the full tsconfig baseline, read `references/config.md`.
