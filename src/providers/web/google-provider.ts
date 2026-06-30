import {
  AuthProvider,
  GoogleAuthOptions,
  SignInOptions,
  SignOutOptions,
  RefreshTokenOptions,
  AuthResult,
  AuthCredential,
  AuthErrorCode,
  AuthUser,
} from '../../definitions';
import { BaseAuthProvider, BaseProviderConfig } from '../base-provider';
import { AuthError } from '../../utils/auth-error';

/** Decoded subset of a Google ID-token (JWT) payload we read. */
interface GoogleIdTokenClaims {
  iss?: string;
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  hd?: string;
  nonce?: string;
  exp?: number;
  [key: string]: unknown;
}

interface GoogleCredentialResponse {
  credential?: string; // the ID token (JWT)
  select_by?: string;
  error?: string;
  error_description?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  nonce?: string;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  use_fedcm_for_prompt?: boolean;
  login_hint?: string;
  hd?: string;
  itp_support?: boolean;
}

interface PromptMomentNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
}

interface GoogleIdApi {
  initialize: (config: GoogleIdConfig) => void;
  prompt: (listener?: (n: PromptMomentNotification) => void) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
  disableAutoSelect: () => void;
  cancel: () => void;
  revoke: (
    hint: string,
    callback?: (response: { successful: boolean; error?: string }) => void
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Web Google provider — the implementation the registry loads on **web / electron**.
 *
 * Uses the **Google Identity Services ID-token flow** (`google.accounts.id`): no client secret, no
 * backend, no popup-blocker problems. The browser returns a Google **ID token** (JWT) which is
 * surfaced as `result.credential.idToken` — the SAME field the native providers populate — so the
 * Firebase handoff is identical on every platform:
 *
 *   await signInWithCredential(getAuth(), GoogleAuthProvider.credential(result.credential.idToken));
 *
 * The id-token flow does NOT return an OAuth `accessToken` (use the GIS token client separately if you
 * need to call Google APIs from the browser). Sign-in is triggered via One-Tap / FedCM `prompt()`; for a
 * guaranteed button UX call {@link renderButton} to render Google's official button (same callback).
 */
export class GoogleAuthProviderWeb extends BaseAuthProvider {
  private loadPromise: Promise<void> | null = null;
  /** Resolver for the in-flight sign-in; the GIS credential callback fulfils it. */
  private pendingResolve: ((result: AuthResult) => void) | null = null;
  private pendingReject: ((error: AuthError) => void) | null = null;
  private currentNonce?: string;

  constructor(config: BaseProviderConfig) {
    super(config);
  }

  get name(): string {
    return AuthProvider.GOOGLE;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    try {
      await this.loadGsi();
      this.configureIdClient();
      await this.loadCurrentUser();
      this.isInitialized = true;
      this.logger.info('Google (web) provider initialized');
    } catch (error) {
      throw AuthError.fromError(error, AuthProvider.GOOGLE);
    }
  }

  async signIn(_options?: SignInOptions): Promise<AuthResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    this.configureIdClient();

    return new Promise<AuthResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = (e) => reject(e);

      const api = this.requireIdApi();
      try {
        api.prompt((notification: PromptMomentNotification) => {
          // One-Tap was suppressed (cooldown / dismissed / FedCM opt-out): fail clearly so the
          // consumer can fall back to renderButton(). Wrapped in try/catch because these moment
          // methods are deprecated under FedCM and may throw.
          try {
            const notDisplayed = notification.isNotDisplayed?.() ?? false;
            const skipped = notification.isSkippedMoment?.() ?? false;
            if (notDisplayed || skipped) {
              const reason =
                notification.getNotDisplayedReason?.() ??
                notification.getSkippedReason?.() ??
                'suppressed';
              this.rejectPending(
                new AuthError(
                  AuthErrorCode.POPUP_BLOCKED,
                  `Google One-Tap was not displayed (${reason}). Render the Google button via ` +
                    `provider.renderButton(element) for a guaranteed sign-in UI, or sign in on web ` +
                    `with your own Firebase popup.`,
                  AuthProvider.GOOGLE
                )
              );
            }
          } catch {
            // FedCM: moment methods unavailable — wait for the credential callback instead.
          }
        });
      } catch (error) {
        this.rejectPending(AuthError.fromError(error, AuthProvider.GOOGLE));
      }
    });
  }

  /**
   * Renders Google's official "Sign in with Google" button into `parent`. Use this when One-Tap is
   * suppressed or you want a deterministic button. The button uses the SAME credential callback, so a
   * click resolves the most recent (or next) {@link signIn} promise with the ID-token credential.
   */
  async renderButton(
    parent: HTMLElement,
    options: Record<string, unknown> = { theme: 'outline', size: 'large' }
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    this.configureIdClient();
    this.requireIdApi().renderButton(parent, options);
  }

  async signOut(_options?: SignOutOptions): Promise<void> {
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch (error) {
      this.logger.warn('Google disableAutoSelect failed', error);
    }
    await this.clearStoredData();
    await this.setCurrentUser(null);
  }

  /**
   * Web ID tokens cannot be refreshed silently — re-running One-Tap (with auto-select) re-issues a
   * fresh ID token for a returning user. Falls back to a normal prompt if auto-select can't.
   */
  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    return this.signIn();
  }

  async revokeAccess(token?: string): Promise<void> {
    const user = this.currentUser ?? (await this.getCurrentUser());
    const hint = user?.email ?? token;
    if (!hint) {
      await this.signOut();
      return;
    }
    await new Promise<void>((resolve) => {
      try {
        this.requireIdApi().revoke(hint, () => resolve());
      } catch {
        resolve();
      }
    });
    await this.signOut();
  }

  async isSupported(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    try {
      await this.loadGsi();
      return true;
    } catch {
      return false;
    }
  }

  // --- internals --------------------------------------------------------------------------------

  private requireIdApi(): GoogleIdApi {
    const api = window.google?.accounts?.id;
    if (!api) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_NOT_INITIALIZED,
        'Google Identity Services not loaded',
        AuthProvider.GOOGLE
      );
    }
    return api;
  }

  private configureIdClient(): void {
    const options = this.options as GoogleAuthOptions;
    if (!options?.clientId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'Google web sign-in requires a `clientId` (your OAuth 2.0 Web client ID).',
        AuthProvider.GOOGLE
      );
    }
    this.currentNonce = options.nonce;
    const config: GoogleIdConfig = {
      client_id: options.clientId,
      callback: (response) => this.handleCredential(response),
      auto_select: options.autoSelectEnabled ?? false,
      cancel_on_tap_outside: false,
      context: 'signin',
      use_fedcm_for_prompt: true,
      itp_support: true,
    };
    if (options.nonce) {
      config.nonce = options.nonce;
    }
    if (options.loginHint) {
      config.login_hint = options.loginHint;
    }
    if (options.hostedDomain) {
      config.hd = options.hostedDomain;
    }
    this.requireIdApi().initialize(config);
  }

  private async handleCredential(
    response: GoogleCredentialResponse
  ): Promise<void> {
    if (response.error || !response.credential) {
      this.rejectPending(
        new AuthError(
          AuthErrorCode.SIGN_IN_FAILED,
          response.error_description ||
            response.error ||
            'No Google ID token returned',
          AuthProvider.GOOGLE
        )
      );
      return;
    }
    try {
      const idToken = response.credential;
      const claims = this.validateIdToken(idToken);
      const user = this.buildUser(claims);
      const credential: AuthCredential = {
        providerId: 'google.com',
        signInMethod: 'google.com',
        idToken,
        tokenType: 'Bearer',
        scope: 'openid email profile',
      };
      await this.setCurrentUser(user);
      this.resolvePending(this.createAuthResult(user, credential, false));
    } catch (error) {
      this.rejectPending(AuthError.fromError(error, AuthProvider.GOOGLE));
    }
  }

  private validateIdToken(idToken: string): GoogleIdTokenClaims {
    const claims = decodeJwtPayload(idToken);
    const options = this.options as GoogleAuthOptions;

    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!claims.iss || !validIssuers.includes(claims.iss)) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        `Unexpected ID token issuer: ${claims.iss}`,
        AuthProvider.GOOGLE
      );
    }
    if (claims.aud !== options.clientId) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'ID token audience does not match the configured clientId',
        AuthProvider.GOOGLE
      );
    }
    if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) {
      throw new AuthError(
        AuthErrorCode.TOKEN_EXPIRED,
        'Google ID token has expired',
        AuthProvider.GOOGLE
      );
    }
    // Validate nonce only when the consumer supplied one (avoids hashing ambiguity otherwise).
    if (this.currentNonce && claims.nonce && claims.nonce !== this.currentNonce) {
      throw new AuthError(
        AuthErrorCode.INVALID_NONCE,
        'ID token nonce does not match the requested nonce',
        AuthProvider.GOOGLE
      );
    }
    return claims;
  }

  private buildUser(claims: GoogleIdTokenClaims): AuthUser {
    const uid = claims.sub || this.generateUniqueId();
    const email = claims.email ?? null;
    const emailVerified =
      claims.email_verified === true || claims.email_verified === 'true';
    const displayName =
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(' ') ||
      null;
    const photoURL = claims.picture ?? null;
    return {
      uid,
      email,
      emailVerified,
      displayName,
      photoURL,
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerData: [
        {
          providerId: 'google.com',
          uid,
          displayName,
          email,
          phoneNumber: null,
          photoURL,
        },
      ],
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
    };
  }

  private resolvePending(result: AuthResult): void {
    const resolve = this.pendingResolve;
    this.pendingResolve = null;
    this.pendingReject = null;
    resolve?.(result);
  }

  private rejectPending(error: AuthError): void {
    const reject = this.pendingReject;
    this.pendingResolve = null;
    this.pendingReject = null;
    if (reject) {
      reject(error);
    } else {
      this.logger.error('Google sign-in error with no pending request', error);
    }
  }

  private loadGsi(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${GSI_SRC}"]`
      );
      const onReady = () =>
        window.google?.accounts?.id
          ? resolve()
          : reject(new Error('Google Identity Services failed to load'));
      if (existing) {
        existing.addEventListener('load', onReady, { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error('Failed to load Google Identity Services')),
          { once: true }
        );
        if (window.google?.accounts?.id) {
          resolve();
        }
        return;
      }
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = onReady;
      script.onerror = () =>
        reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    }).finally(() => {
      this.loadPromise = null;
    });
    return this.loadPromise;
  }
}

/** Decodes a JWT payload (no signature verification — Google issues the token directly to this origin). */
function decodeJwtPayload(jwt: string): GoogleIdTokenClaims {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new AuthError(
      AuthErrorCode.INVALID_TOKEN,
      'Malformed Google ID token',
      AuthProvider.GOOGLE
    );
  }
  if (typeof atob !== 'function') {
    // This provider only runs in the browser (the registry routes native platforms to the native
    // bridge); `atob` is always present there.
    throw new AuthError(
      AuthErrorCode.INTERNAL_ERROR,
      'Google web sign-in requires a browser environment (atob unavailable).',
      AuthProvider.GOOGLE
    );
  }
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as GoogleIdTokenClaims;
}
