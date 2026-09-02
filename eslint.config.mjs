import tseslint from 'typescript-eslint';

// Flat config. Uses the unified `typescript-eslint` package (NOT `@eslint/js`,
// which is intentionally avoided — see global ESLint standard). Linting is scoped
// to TypeScript sources via the `lint` script (`eslint . --ext ts`).
export default tseslint.config(
  {
    // Migrated from the (ESLint 10-deprecated) .eslintignore file into this flat config.
    ignores: [
      'dist/',
      'node_modules/',
      'android/',
      'ios/',
      'example/',
      'examples/',
      'coverage/',
      'reports/',
      'build/',
      'lib/',
      'output/',
      'public/',
      'apps-resources/',
      'assets/',
      'project-record/',
      '.history/',
      'rollup.config.js',
      'rollup.config.mjs',
      'eslint.config.mjs',
      '.eslintrc.js',
      'scripts/',
      'test/',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.node.json'],
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        location: 'readonly',
        history: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Storage: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  }
);
