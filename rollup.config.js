import resolve from '@rollup/plugin-node-resolve';
import { readFileSync } from 'fs';

// Read package.json to get dependencies
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// External dependencies that shouldn't be bundled
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
  '@capacitor/core',
  'react',
  'react-dom'
];

// Base configuration
const baseConfig = {
  external,
  plugins: [
    resolve({
      preferBuiltins: false,
    }),
  ],
};

export default [
  // Main entry point
  {
    ...baseConfig,
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/plugin.js',
        format: 'iife',
        name: 'CapacitorAuthManager',
        globals: {
          '@capacitor/core': 'capacitorExports',
        },
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: 'dist/plugin.cjs.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
  },
  // Core module
  {
    ...baseConfig,
    input: 'dist/esm/core/index.js',
    output: [
      {
        file: 'dist/core.cjs.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
  },
  // React module
  {
    ...baseConfig,
    input: 'dist/esm/react/index.js',
    output: [
      {
        file: 'dist/react.cjs.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    external: [...baseConfig.external, 'react', 'react-dom'],
  },
];