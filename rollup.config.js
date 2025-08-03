import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { readFileSync, existsSync } from 'fs';

// Read package.json to get dependencies
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// External dependencies that shouldn't be bundled
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
  '@capacitor/core',
  'react',
  'react-dom',
  'vue',
  '@angular/core',
  '@angular/common',
  '@angular/router',
  'rxjs',
  'rxjs/operators'
];

// Base configuration
const baseConfig = {
  external,
  plugins: [
    resolve({
      preferBuiltins: false,
    }),
    json(),
  ],
};

// Check if framework modules exist before adding them to the build
const configs = [
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
];

// Add framework modules only if they exist
if (existsSync('dist/esm/react/index.js')) {
  configs.push({
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
  });
}

if (existsSync('dist/esm/vue/index.js')) {
  configs.push({
    ...baseConfig,
    input: 'dist/esm/vue/index.js',
    output: [
      {
        file: 'dist/vue.cjs.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    external: [...baseConfig.external, 'vue'],
  });
}

if (existsSync('dist/esm/angular/index.js')) {
  configs.push({
    ...baseConfig,
    input: 'dist/esm/angular/index.js',
    output: [
      {
        file: 'dist/angular.cjs.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    external: [
      ...baseConfig.external, 
      '@angular/core',
      '@angular/common',
      '@angular/router',
      'rxjs',
      'rxjs/operators'
    ],
  });
}

export default configs;