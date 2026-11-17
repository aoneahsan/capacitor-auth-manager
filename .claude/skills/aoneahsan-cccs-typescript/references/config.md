# tsconfig + ESLint baseline

## tsconfig baseline (app)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "paths": { "@/*": ["./src/*"] },   // relative — no baseUrl, TS7-ready

    "sourceMap": false,
    "inlineSourceMap": false,
    "declarationMap": false,

    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

`noUnusedLocals`/`noUnusedParameters` pair with the delete-unused-code rule: the compiler enforces it, so
nobody is tempted to underscore-rename.

`skipLibCheck: true` is deliberate — checking third-party declaration files finds their bugs, not ours.

## ESLint pairing

Use `typescript-eslint`. **Never `@eslint/js`** — broken versioning.

```js
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',                          // logger is the only exemption
      'react-hooks/exhaustive-deps': 'warn',          // warn, not error — see below
    },
  },
);
```

`exhaustive-deps` is a **warning** deliberately: violations are often correct (see
`aoneahsan-cccs-coding-standards`), and making it an error either breaks the build or pressures people into
adding deps that cause excessive re-renders.

## Source maps off, per build tool

| Tool | Setting |
|---|---|
| Vite | `build.sourcemap: false` |
| Rollup | `output.sourcemap: false` on every output |
| Webpack (prod) | `devtool: false` |
| tsup | `sourcemap: false` |
| tsc (library) | `"sourceMap": false, "inlineSourceMap": false, "declarationMap": false` |

## Config files are often outside `tsconfig.include`

`capacitor.config.ts`, `vite.config.ts` and ESLint configs are frequently excluded from `include` and from
lint ignores — which means **`yarn typecheck` and `yarn lint` will not catch mistakes in them**. For
`capacitor.config.ts` specifically, the generated
`android/app/src/main/assets/capacitor.config.json` is the only real gate. Inspect it after `cap sync`.
