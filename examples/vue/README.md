# Vue 3 Example

This example demonstrates how to use the capacitor-auth-manager package with Vue 3 and the Composition API.

## Features

- ✅ No plugins or providers needed
- ✅ Vue 3 Composition API with TypeScript
- ✅ Reactive auth state using Vue refs
- ✅ Vue Router integration with route guards
- ✅ Multiple authentication methods
- ✅ Clean composable-based API

## Setup

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your provider credentials.

3. Start the development server:

   ```bash
   yarn dev
   ```

4. Open http://localhost:3001 in your browser

## Project Structure

```
src/
├── pages/
│   ├── Home.vue       # Home page
│   ├── Login.vue      # Login with all auth methods
│   └── Profile.vue    # Protected profile page
├── App.vue           # Root component with navigation
├── main.ts          # App entry with auth config & router
└── style.css        # Global styles
```

## Usage

### Configuration

Auth is configured once in `main.ts`:

```typescript
import { auth } from 'capacitor-auth-manager';

auth.configure({
  providers: {
    google: { clientId: 'your-client-id' },
    github: { clientId: 'your-client-id' },
  },
  persistence: 'local',
});
```

### Using Composables

The package provides Vue 3 composables that return reactive refs:

```vue
<script setup lang="ts">
import { useAuth, useUser, useToken } from 'capacitor-auth-manager/vue';

// Main composable with everything
const { user, isAuthenticated, signIn, signOut } = useAuth();

// Just the user (reactive ref)
const user = useUser();

// Token management
const { token, refreshToken } = useToken();

// Sign in
const handleSignIn = async () => {
  await signIn('google');
};
</script>

<template>
  <div v-if="isAuthenticated">Welcome, {{ user.displayName }}!</div>
</template>
```

### Route Guards

Protect routes using Vue Router guards:

```typescript
router.beforeEach((to, from, next) => {
  const isAuthenticated = auth.getAuthState().isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});
```

## Authentication Methods

### Social Login

- Google
- GitHub
- Facebook
- Microsoft

### Email/Password

- Sign up with email/password
- Sign in with email/password

### Magic Link

- Passwordless email authentication

## Reactive State

All composables return Vue refs that automatically update:

```vue
<script setup>
const { isAuthenticated, user } = useAuth();
// These are reactive refs - UI updates automatically
</script>
```

## No Plugins Required!

Unlike traditional Vue auth libraries, no Vue plugin installation needed:

```typescript
// ❌ No need for this!
app.use(AuthPlugin);

// ✅ Just import and use!
import { useAuth } from 'capacitor-auth-manager/vue';
```

## Environment Variables

Create a `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
```
