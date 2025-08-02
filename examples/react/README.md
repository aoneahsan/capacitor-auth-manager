# React Example

This example demonstrates how to use the capacitor-auth-manager package with React.

## Features

- ✅ Provider-less architecture (no context providers needed!)
- ✅ TypeScript support
- ✅ Multiple authentication providers
- ✅ Protected routes with React Router
- ✅ Custom hooks for auth state
- ✅ Email/password authentication
- ✅ Magic link authentication
- ✅ Social logins (Google, GitHub, Facebook, Microsoft)

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

4. Open http://localhost:3000 in your browser

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx         # App layout with navigation
│   └── ProtectedRoute.tsx # Route guard component
├── pages/
│   ├── Home.tsx          # Home page
│   ├── Login.tsx         # Login page with all auth methods
│   └── Profile.tsx       # Protected profile page
├── App.tsx               # Main app component with routing
├── main.tsx             # App entry point with auth config
└── index.css            # Global styles
```

## Usage

### Configuration

Auth is configured once in `main.tsx`:

```typescript
import { auth } from 'capacitor-auth-manager'

auth.configure({
  providers: {
    google: { clientId: 'your-client-id' },
    github: { clientId: 'your-client-id' }
  },
  persistence: 'local'
})
```

### Using Hooks

The package provides several React hooks:

```typescript
import { useAuth, useUser, useToken } from 'capacitor-auth-manager/react'

function MyComponent() {
  // Main hook with everything
  const { user, isAuthenticated, signIn, signOut } = useAuth()
  
  // Just the user
  const user = useUser()
  
  // Token management
  const { token, refreshToken } = useToken()
  
  // Sign in
  const handleSignIn = async () => {
    await signIn('google')
  }
}
```

### Protected Routes

```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return children
}
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
- Send sign-in link to email
- Passwordless authentication

## No Context Providers!

Unlike traditional React auth libraries, this package doesn't require wrapping your app in context providers. Just import and use:

```typescript
// ❌ No need for this!
<AuthProvider>
  <App />
</AuthProvider>

// ✅ Just import and use!
import { useAuth } from 'capacitor-auth-manager/react'
```

## Environment Variables

Create a `.env` file with your provider credentials:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
```