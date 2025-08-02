# Vanilla JavaScript Example

This example demonstrates how to use the capacitor-auth-manager package with vanilla JavaScript (no framework).

## Features

- Provider-less authentication
- Multiple social login providers
- Email magic link authentication
- Email/password authentication
- Session persistence
- Real-time auth state updates

## Setup

1. Install dependencies:
   ```bash
   # No dependencies needed for vanilla JS!
   # Just serve the HTML file
   ```

2. Configure authentication providers:
   - Copy `.env.example` to `.env`
   - Add your provider credentials

3. Serve the HTML file:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .

   # Using PHP
   php -S localhost:8000
   ```

4. Open http://localhost:8000 in your browser

## File Structure

- `index.html` - Main application file with all JavaScript inline
- `README.md` - This file

## How It Works

The example uses ES modules to import the auth manager:

```javascript
import { auth } from '../../dist/esm/index.js';
```

It then configures the authentication providers and subscribes to auth state changes:

```javascript
// Configure providers
auth.configure({
  providers: {
    google: { clientId: 'your-client-id' },
    github: { clientId: 'your-client-id' }
    // ... other providers
  }
});

// Subscribe to auth state
auth.onAuthStateChange((state) => {
  if (state.isAuthenticated) {
    // User is logged in
    console.log('User:', state.user);
  } else {
    // User is logged out
  }
});
```

## Supported Providers

- Google
- GitHub  
- Facebook
- Microsoft
- Apple
- Email Magic Link
- Email/Password

## Notes

- This example loads the auth manager from the local build directory
- For production, you would use the npm package or CDN
- All authentication happens client-side
- Sessions are persisted in localStorage by default