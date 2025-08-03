import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from 'capacitor-auth-manager/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card">
      <h1>Welcome to Capacitor Auth Manager Angular Example</h1>
      <p>
        This Angular example demonstrates the provider-less authentication system
        using services and RxJS observables.
      </p>
      
      <div *ngIf="isAuthenticated$ | async; else notAuthenticated">
        <h2>You're logged in!</h2>
        <p>Welcome back, {{ (user$ | async)?.displayName || (user$ | async)?.email || 'User' }}!</p>
        <a routerLink="/profile" class="btn btn-primary">
          View Profile
        </a>
      </div>
      
      <ng-template #notAuthenticated>
        <h2>Get Started</h2>
        <p>Sign in to access your profile and protected features.</p>
        <a routerLink="/login" class="btn btn-primary">
          Sign In
        </a>
      </ng-template>
      
      <div style="margin-top: 2rem">
        <h3>Features:</h3>
        <ul>
          <li>✅ No complex setup required</li>
          <li>✅ Angular 16+ with standalone components</li>
          <li>✅ RxJS observables for reactive state</li>
          <li>✅ Multiple authentication providers</li>
          <li>✅ TypeScript support</li>
          <li>✅ Route guards</li>
          <li>✅ Dependency injection</li>
        </ul>
      </div>
    </div>
  `,
  styles: []
})
export class HomeComponent {
  isAuthenticated$ = this.authService.isAuthenticated$;
  user$ = this.authService.user$;

  constructor(private authService: AuthService) {}
}