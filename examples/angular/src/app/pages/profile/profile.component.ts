import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'capacitor-auth-manager/angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h1>User Profile</h1>

      <div class="user-info">
        <h3>User Information</h3>
        <pre>{{ user$ | async | json }}</pre>
      </div>

      <div class="user-info">
        <h3>Auth State</h3>
        <pre>{{ authState$ | async | json }}</pre>
      </div>

      <div
        *ngIf="tokenInfo$ | async as tokenInfo"
        class="user-info"
      >
        <h3>Token Information</h3>
        <p>
          <strong>Token:</strong> {{ tokenInfo.token?.substring(0, 20) }}...
        </p>
        <p *ngIf="tokenInfo.expiresAt">
          <strong>Expires:</strong> {{ tokenInfo.expiresAt | date: 'medium' }}
        </p>
      </div>

      <h3>Angular Service Demo</h3>
      <p>This page demonstrates the Angular service features:</p>
      <ul>
        <li>
          <code>AuthService</code> - Injectable service with RxJS observables
        </li>
        <li><code>user$</code> - Observable of current user</li>
        <li><code>isAuthenticated$</code> - Observable of auth state</li>
        <li><code>authState$</code> - Full auth state observable</li>
        <li><code>AuthGuard</code> - Route protection</li>
      </ul>

      <h3>Observable State</h3>
      <p>
        All service properties are RxJS observables that automatically update:
      </p>
      <div class="user-info">
        <pre>{{ observableDemo$ | async | json }}</pre>
      </div>

      <button
        (click)="signOut()"
        class="btn btn-danger"
        style="margin-top: 2rem"
      >
        Sign Out
      </button>
    </div>
  `,
  styles: [],
})
export class ProfileComponent implements OnDestroy {
  user$ = this.authService.user$;
  authState$ = this.authService.authState$;
  tokenInfo$ = this.authService.getToken();
  observableDemo$ = this.authService.isAuthenticated$.pipe(
    map((isAuthenticated) => ({
      isAuthenticated,
      timestamp: new Date().toISOString(),
    }))
  );

  private subscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  signOut(): void {
    this.subscription = this.authService.signOut().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => console.error('Sign out error:', error),
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}

// Import map operator
import { map } from 'rxjs/operators';
