# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Capacitor plugin project called "Capacitor Auth Manager" that provides comprehensive authentication implementations across Android, iOS, and Web platforms. The project aims to support 13+ authentication methods using only official SDKs/APIs.

## Commands

### Development Commands
- **Build**: `npm run build` - Cleans, compiles TypeScript, and bundles with Rollup
- **Clean**: `npm run clean` - Removes the dist directory
- **TypeScript Compile**: `npm run tsc` - Compiles TypeScript files
- **Watch Mode**: `npm run watch` - Watches TypeScript files for changes
- **Lint**: `npm run lint` - Runs ESLint on all TypeScript files
- **Format**: `npm run prettier` - Formats all code files with Prettier
- **iOS Lint**: `npm run swiftlint` - Runs SwiftLint on iOS code (when ios/ exists)
- **Configure**: `npm run configure` - Interactive configuration script for setting up auth providers

### Package Manager
This project uses Yarn. Install dependencies with `yarn install`.

## Architecture

### Project Structure
- **src/**: TypeScript source code for the plugin
  - `definitions.ts`: Plugin interface definitions
  - `index.ts`: Main entry point
  - `web.ts`: Web implementation
- **android/**: Android native implementation (to be created)
- **ios/**: iOS native implementation (to be created)
- **dist/**: Build output directory

### Build System
- **TypeScript**: Targets ES2017, strict mode enabled
- **Rollup**: Creates IIFE and CommonJS bundles
- **Output formats**:
  - ESM modules in `dist/esm/`
  - CommonJS in `dist/plugin.cjs.js`
  - IIFE bundle in `dist/plugin.js`

### Authentication Providers to Implement
1. Firebase Auth
2. Google Auth
3. Apple Auth
4. Microsoft Auth
5. Facebook Auth
6. GitHub Auth
7. Slack Auth
8. LinkedIn Auth
9. Email Magic Link Auth
10. SMS Auth
11. Email/Phone/Username + Password Auth
12. Email Code Auth
13. Biometric Auth (using capacitor-biometric-authentication package)

### Key Requirements
- **Subscribable Auth State**: Must provide observable authentication state
- **Official SDKs Only**: Use only official provider SDKs/APIs, no unofficial packages
- **Framework Independent**: Should work with any JavaScript framework
- **Type Safety**: Full TypeScript support with proper type definitions
- **Security**: Follow security best practices for authentication
- **Performance**: Optimize for minimal overhead and fast authentication flows

### Code Style
- ESLint configuration with TypeScript support
- Prettier formatting with single quotes, 2-space indentation
- No trailing commas in ES5 style
- Semicolons required

## Important Implementation Notes

1. **Native Platform Files**: The android/ and ios/ directories referenced in package.json need to be created when implementing native functionality.

2. **Provider Configuration**: Each authentication provider should be independently configurable with all options their native SDK provides.

3. **Capacitor Plugin Structure**: Follow Capacitor's plugin development guidelines for proper native bridge implementation.

4. **Testing**: No test framework is currently configured. Consider adding testing infrastructure as the plugin develops.

5. **Package Metadata**:
   - Package ID: `com.aoneahsan.capacitor_auth_manager`
   - NPM package: `capacitor-auth-manager`
   - Repository: https://github.com/aoneahsan/capacitor-auth-manager