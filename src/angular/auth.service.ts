import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { auth } from '../core/auth-manager.js';
import type { AuthState, AuthManagerConfig } from '../core/types.js';
import type {
  AuthUser,
  AuthResult,
  AuthProvider,
  SignInOptions,
  SignOutOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  GetIdTokenOptions,
  UpdateProfileOptions,
  DeleteAccountOptions,
} from '../definitions.js';

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
  configure(config: AuthManagerConfig): void {
    auth.configure(config);
  }

  /**
   * Initialize auth manager
   */
  initialize(config?: AuthManagerConfig): Observable<void> {
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
   * Link an additional provider credential to the current account.
   */
  linkAccount(options: LinkAccountOptions): Observable<AuthResult> {
    return from(auth.linkAccount(options)).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Unlink a provider credential from the current account.
   */
  unlinkAccount(options: UnlinkAccountOptions): Observable<void> {
    return from(auth.unlinkAccount(options)).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Revoke access for a provider (current provider when omitted).
   */
  revokeAccess(token?: string, provider?: string): Observable<void> {
    return from(auth.revokeAccess(token, provider)).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Get the current ID token for a provider (current provider when omitted).
   */
  getIdToken(options?: GetIdTokenOptions): Observable<string> {
    return from(auth.getIdToken(options)).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Update the signed-in user's profile.
   */
  updateProfile(options: UpdateProfileOptions): Observable<AuthUser> {
    return from(auth.updateProfile(options)).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Delete the current account, then clear local session.
   */
  deleteAccount(options?: DeleteAccountOptions): Observable<void> {
    return from(auth.deleteAccount(options)).pipe(
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

  signIn(options?: SignInOptions['options']): Observable<AuthResult> {
    return this.authService.signIn({
      provider: this.provider as AuthProvider,
      options,
    });
  }

  signOut(options?: SignOutOptions): Observable<void> {
    return this.authService.signOut({
      ...options,
      provider: this.provider as AuthProvider,
    });
  }

  private checkConfiguration(): boolean {
    return auth.isProviderConfigured(this.provider);
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
