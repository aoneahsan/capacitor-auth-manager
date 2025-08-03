import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'capacitor-auth-manager/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card" style="max-width: 400px; margin: 0 auto">
      <h1>Sign In</h1>
      
      <div *ngIf="error" class="error-message">{{ error }}</div>
      <div *ngIf="message" [class]="message.includes('Failed') ? 'error-message' : 'success-message'">
        {{ message }}
      </div>

      <div style="margin-bottom: 2rem">
        <h3>Social Login</h3>
        <button 
          (click)="signInWithProvider('google')" 
          class="btn btn-primary btn-social"
          [disabled]="isLoading"
        >
          Sign in with Google
        </button>
        <button 
          (click)="signInWithProvider('github')" 
          class="btn btn-primary btn-social"
          [disabled]="isLoading"
        >
          Sign in with GitHub
        </button>
        <button 
          (click)="signInWithProvider('facebook')" 
          class="btn btn-primary btn-social"
          [disabled]="isLoading"
        >
          Sign in with Facebook
        </button>
        <button 
          (click)="signInWithProvider('microsoft')" 
          class="btn btn-primary btn-social"
          [disabled]="isLoading"
        >
          Sign in with Microsoft
        </button>
      </div>

      <hr style="margin: 2rem 0" />

      <form (ngSubmit)="handleEmailAuth()">
        <h3>{{ isSignUp ? 'Create Account' : 'Email & Password' }}</h3>
        
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            [(ngModel)]="email"
            name="email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
            required
            [disabled]="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            [(ngModel)]="password"
            name="password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
            [disabled]="isLoading"
          />
        </div>

        <button 
          type="submit" 
          class="btn btn-primary" 
          style="width: 100%"
          [disabled]="isLoading"
        >
          {{ isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In') }}
        </button>

        <p style="text-align: center; margin-top: 1rem">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          {{ ' ' }}
          <button 
            type="button"
            (click)="isSignUp = !isSignUp"
            style="background: none; border: none; color: #1976d2; cursor: pointer; text-decoration: underline"
            [disabled]="isLoading"
          >
            {{ isSignUp ? 'Sign In' : 'Sign Up' }}
          </button>
        </p>
      </form>

      <hr style="margin: 2rem 0" />

      <div>
        <h3>Magic Link</h3>
        <p>Get a sign-in link sent to your email</p>
        <button 
          (click)="sendMagicLink()" 
          class="btn btn-primary"
          style="width: 100%"
          [disabled]="isLoading || !email"
        >
          Send Magic Link
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnDestroy {
  email = '';
  password = '';
  isSignUp = false;
  isLoading = false;
  message = '';
  error = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  signInWithProvider(provider: string): void {
    this.isLoading = true;
    this.message = '';
    this.error = '';
    
    const sub = this.authService.signIn(provider).subscribe({
      next: () => {
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        console.error(`${provider} sign in error:`, err);
        this.error = `Failed to sign in with ${provider}`;
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  handleEmailAuth(): void {
    this.isLoading = true;
    this.message = '';
    this.error = '';
    
    const authMethod = this.isSignUp 
      ? this.authService.signUp({ email: this.email, password: this.password })
      : this.authService.signIn('email-password', { email: this.email, password: this.password });
    
    const sub = authMethod.subscribe({
      next: () => {
        if (this.isSignUp) {
          this.message = 'Account created successfully! You can now sign in.';
          this.isSignUp = false;
          this.isLoading = false;
        } else {
          this.router.navigate(['/profile']);
        }
      },
      error: (err) => {
        console.error('Email auth error:', err);
        this.error = this.isSignUp ? 'Failed to create account' : 'Failed to sign in';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  sendMagicLink(): void {
    if (!this.email) {
      this.error = 'Please enter your email address';
      return;
    }
    
    this.isLoading = true;
    this.message = '';
    this.error = '';
    
    const sub = this.authService.signIn('magic-link', { email: this.email }).subscribe({
      next: () => {
        this.message = 'Magic link sent! Check your email.';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Magic link error:', err);
        this.error = 'Failed to send magic link';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}