# Angular Example

This example demonstrates how to use the capacitor-auth-manager package with Angular 16+ using standalone components.

## Features

- ✅ Angular service with dependency injection
- ✅ RxJS observables for reactive state
- ✅ Standalone components (no NgModules needed)
- ✅ Route guards for protected routes
- ✅ Multiple authentication methods
- ✅ Full TypeScript support

## Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Configure auth providers in `src/main.ts`:
   ```typescript
   AuthModule.forRoot({
     providers: {
       google: { clientId: 'your-google-client-id' },
       github: { clientId: 'your-github-client-id' }
     }
   })
   ```

3. Start the development server:
   ```bash
   yarn start
   ```

4. Open http://localhost:4200 in your browser

## Project Structure

```
src/
├── app/
│   ├── pages/
│   │   ├── home/         # Home page component
│   │   ├── login/        # Login page with all auth methods
│   │   └── profile/      # Protected profile page
│   ├── app.component.ts  # Root component with navigation
│   └── app.routes.ts     # Route configuration with guards
├── main.ts              # Bootstrap with auth module
├── index.html          # App entry HTML
└── styles.css          # Global styles
```

## Usage

### Module Configuration

Configure the AuthModule in `main.ts`:

```typescript
import { AuthModule } from 'capacitor-auth-manager/angular';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      AuthModule.forRoot({
        providers: {
          google: { clientId: 'your-client-id' }
        },
        persistence: 'local'
      })
    )
  ]
});
```

### Using AuthService

Inject the service into your components:

```typescript
import { AuthService } from 'capacitor-auth-manager/angular';

@Component({...})
export class MyComponent {
  user$ = this.authService.user$;
  isAuthenticated$ = this.authService.isAuthenticated$;
  
  constructor(private authService: AuthService) {}
  
  signIn(provider: string) {
    this.authService.signIn(provider).subscribe({
      next: (result) => console.log('Signed in!', result),
      error: (error) => console.error('Sign in failed', error)
    });
  }
}
```

### Route Guards

Protect routes with AuthGuard:

```typescript
const routes: Routes = [
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  }
];
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

## RxJS Observables

The AuthService provides reactive observables:

```typescript
// Current user
user$: Observable<AuthUser | null>

// Authentication status
isAuthenticated$: Observable<boolean>

// Full auth state
authState$: Observable<AuthState>

// Methods return observables
signIn(provider: string): Observable<AuthResult>
signOut(): Observable<void>
```

## Standalone Components

This example uses Angular's standalone components:

```typescript
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `...`
})
export class ProfileComponent { }
```

No NgModules required!