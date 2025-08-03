# Capacitor Auth Manager Examples

This directory contains example applications demonstrating how to use the capacitor-auth-manager package with different frameworks.

## Examples

### 1. Vanilla JavaScript

- Basic HTML/JS implementation
- Shows direct usage without any framework
- Demonstrates all authentication methods

### 2. React

- React 18+ with TypeScript
- Uses React hooks (`useAuth`, `useAuthState`, etc.)
- Demonstrates provider-less architecture

### 3. Vue 3

- Vue 3 with Composition API
- Uses Vue composables
- Shows reactive auth state management

### 4. Angular

- Angular 16+ with standalone components
- Uses Angular service and guards
- Demonstrates RxJS integration

### 5. Next.js

- Server-side rendering considerations
- API route integration
- Protected pages example

### 6. Capacitor Mobile App

- iOS and Android implementation
- Native provider integration
- Biometric authentication example

## Running Examples

Each example has its own README with specific instructions. Generally:

1. Navigate to the example directory
2. Install dependencies: `yarn install`
3. Configure auth providers (see each example's README)
4. Run the development server: `yarn dev`

## Common Setup

All examples require you to configure at least one authentication provider. Create a `.env` file in each example directory with your provider credentials:

```env
# Google Auth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# GitHub Auth
VITE_GITHUB_CLIENT_ID=your-github-client-id

# Facebook Auth
VITE_FACEBOOK_APP_ID=your-facebook-app-id

# Firebase Auth
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Features Demonstrated

- ✅ Provider-less authentication (no context providers needed)
- ✅ Dynamic provider loading
- ✅ Framework-agnostic core
- ✅ TypeScript support
- ✅ Multiple authentication methods
- ✅ Persistent sessions
- ✅ Token management
- ✅ Error handling
- ✅ Loading states
- ✅ Protected routes
- ✅ Social login flows
- ✅ Email/password authentication
- ✅ Biometric authentication (mobile only)
