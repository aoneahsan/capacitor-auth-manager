import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { auth } from '../core/auth-manager';
import type { AuthState } from '../core/types';
import type {
  AuthUser,
  AuthResult,
  SignInOptions,
  SignOutOptions,
} from '../definitions';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private stateSubject: BehaviorSubject<AuthState>;
  private unsubscribe: (() => void) | null = null;

  // Observable streams
  public state$: Observable<AuthState>;
  public user$: Observable<AuthUser | null>;
  public isAuthenticated$: Observable<boolean>;
  public isLoading$: Observable<boolean>;
  public provider$: Observable<string | null>;

  constructor() {
    // Initialize with current state
    const initialState = auth.getAuthState();
    this.stateSubject = new BehaviorSubject<AuthState>(initialState);

    // Set up observables
    this.state$ = this.stateSubject.asObservable();
    this.user$ = this.state$.pipe(map((state) => state.user));
    this.isAuthenticated$ = this.state$.pipe(
      map((state) => state.isAuthenticated)
    );
    this.isLoading$ = this.state$.pipe(map((state) => state.isLoading));
    this.provider$ = this.state$.pipe(map((state) => state.provider));

    // Subscribe to auth state changes
    this.unsubscribe = auth.onAuthStateChange((newState) => {
      this.stateSubject.next(newState);
    });
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.stateSubject.complete();
  }

  /**
   * Configure auth manager
   */
  configure(config: any): void {
    auth.configure(config);
  }

  /**
   * Initialize auth manager
   */
  initialize(config?: any): Observable<void> {
    return from(auth.initialize(config));
  }

  /**
   * Sign in with a provider
   */
  signIn(providerOrOptions: string | SignInOptions): Observable<AuthResult> {
    return from(auth.signIn(providerOrOptions)).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Sign out
   */
  signOut(options?: SignOutOptions): Observable<void> {
    return from(auth.signOut(options)).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Refresh token
   */
  refreshToken(provider?: string): Observable<AuthResult> {
    return from(auth.refreshToken(provider)).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Get current user synchronously
   */
  getCurrentUser(): AuthUser | null {
    return auth.getCurrentUser();
  }

  /**
   * Get current auth state synchronously
   */
  getAuthState(): AuthState {
    return auth.getAuthState();
  }

  /**
   * Check if authenticated synchronously
   */
  isAuthenticated(): boolean {
    return auth.isAuthenticated();
  }

  /**
   * Get current provider synchronously
   */
  getCurrentProvider(): string | null {
    return auth.getCurrentProvider();
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Observable<string[]> {
    return from(auth.getAvailableProviders());
  }

  /**
   * Get supported providers for current platform
   */
  getSupportedProviders(): Observable<string[]> {
    return from(auth.getSupportedProviders());
  }

  /**
   * Check if a provider is supported
   */
  isProviderSupported(provider: string): Observable<boolean> {
    return from(auth.isProviderSupported(provider));
  }
}

/**
 * Provider-specific service
 */
@Injectable()
export class AuthProviderService {
  private provider: string;
  private authService: AuthService;

  isSupported$: Observable<boolean>;
  isConfigured$: Observable<boolean>;

  constructor(provider: string, authService: AuthService) {
    this.provider = provider;
    this.authService = authService;

    this.isSupported$ = from(auth.isProviderSupported(provider));
    this.isConfigured$ = from(Promise.resolve(this.checkConfiguration()));
  }

  signIn(options?: any): Observable<AuthResult> {
    return this.authService.signIn({
      provider: this.provider as any,
      options,
    });
  }

  signOut(options?: any): Observable<void> {
    return this.authService.signOut({
      ...options,
      provider: this.provider,
    });
  }

  private checkConfiguration(): boolean {
    return !!(auth as any).config?.providers?.[this.provider];
  }
}

/**
 * Factory for creating provider-specific services
 */
@Injectable({
  providedIn: 'root',
})
export class AuthProviderFactory {
  constructor(private authService: AuthService) {}

  create(provider: string): AuthProviderService {
    return new AuthProviderService(provider, this.authService);
  }
}
