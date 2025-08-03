import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'capacitor-auth-manager/angular';
import { AuthUser } from 'capacitor-auth-manager';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-content">
        <a routerLink="/" class="navbar-brand">
          Auth Manager Angular Demo
        </a>
        <div class="navbar-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            Home
          </a>
          <ng-container *ngIf="isAuthenticated$ | async; else loginLink">
            <a routerLink="/profile" routerLinkActive="active">
              Profile
            </a>
            <span>Hello, {{ (user$ | async)?.displayName || (user$ | async)?.email || 'User' }}</span>
            <button (click)="signOut()" class="btn btn-danger">
              Sign Out
            </button>
          </ng-container>
          <ng-template #loginLink>
            <a routerLink="/login" class="btn btn-primary">
              Sign In
            </a>
          </ng-template>
        </div>
      </div>
    </nav>
    
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: []
})
export class AppComponent implements OnDestroy {
  isAuthenticated$ = this.authService.isAuthenticated$;
  user$ = this.authService.user$;
  private subscription?: Subscription;

  constructor(private authService: AuthService) {}

  signOut(): void {
    this.subscription = this.authService.signOut().subscribe({
      error: (error) => console.error('Sign out error:', error)
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}