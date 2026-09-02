import {
  AuthProvider,
  GoogleAuthOptions,
  GoogleWebFlow,
  SignInOptions,
  SignOutOptions,
  RefreshTokenOptions,
  AuthResult,
  AuthCredential,
  AuthErrorCode,
  AuthUser,
} from '../../definitions.js';
import { BaseAuthProvider, BaseProviderConfig } from '../base-provider.js';
import { AuthError } from '../../utils/auth-error.js';

/** Decoded subset of a Google ID-token (JWT) payload / userinfo response we read. */
interface GoogleProfileClaims {
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

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: string | number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: { type?: string; message?: string }) => void;
  prompt?: '' | 'none' | 'consent' | 'select_account';
  hint?: string;
  hosted_domain?: string;
  include_granted_scopes?: boolean;
}

interface GoogleTokenClient {
  requestAccessToken: (overrides?: { prompt?: string; hint?: string }) => void;
}

interface GoogleOAuth2Api {
  initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
  revoke: (accessToken: string, callback?: () => void) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi; oauth2?: GoogleOAuth2Api } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const DEFAULT_SCOPES = ['openid', 'email', 'profile'];

/**
 * Web Google provider — the implementation the registry loads on **web / electron**.
 *
 * Two Google Identity Services flows are available, selected by {@link GoogleAuthOptions.webFlow}
 * (default `'auto'`):
 *
 * 1. **One-Tap / FedCM id-token flow** (`google.accounts.id`): returns a Google **ID token** (JWT) as
 *    `result.credential.idToken` — the same field the native providers populate.
 * 2. **OAuth2 popup flow** (`google.accounts.oauth2.initTokenClient`): a deterministic popup that works
 *    from any click handler and returns an **access token** as `result.credential.accessToken`; the user
 *    profile is read from Google's `userinfo` endpoint. `'auto'` falls back to this whenever the browser
 *    does not display One-Tap (cooldown, FedCM opt-out, third-party-cookie settings).
 *
 * Either credential is accepted by Firebase — the handoff is identical on every platform:
 *
 *   const { idToken, accessToken } = result.credential;
 *   await signInWithCredential(getAuth(), GoogleAuthProvider.credential(idToken ?? null, accessToken));
 *
 * Neither flow needs a client secret or a backend. For Google's official button call
 * {@link renderButton}; it shares the One-Tap credential callback.
 */
export class GoogleAuthProviderWeb extends BaseAuthProvider {
  private loadPromise: Promise<void> | null = null;
  /** Resolver for the in-flight sign-in; the GIS credential callback fulfils it. */
  private pendingResolve: ((result: AuthResult) => void) | null = null;
  private pendingReject: ((error: AuthError) => void) | null = null;
  private currentNonce?: string;
  /** Last credential issued in this page session (tokens are deliberately not persisted). */
  private lastCredential: AuthCredential | null = null;

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
      this.requireClientId();
      await this.loadGsi();
      this.configureIdClient();
      await this.loadCurrentUser();
      this.isInitialized = true;
      this.logger.info('Google (web) provider initialized');
    } catch (error) {
      throw AuthError.fromError(error, AuthProvider.GOOGLE);
    }
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    // AuthManagerCore spreads per-call options to the top level; direct callers nest them under
    // `options`. Read both shapes.
    const perCall = (options ?? {}) as Partial<SignInOptions> & {
      webFlow?: GoogleWebFlow;
      loginHint?: string;
    };
    const flow: GoogleWebFlow =
      perCall.options?.webFlow ??
      perCall.webFlow ??
      (this.options as GoogleAuthOptions).webFlow ??
      'auto';
    const loginHint =
      perCall.options?.loginHint ??
      perCall.loginHint ??
      (this.options as GoogleAuthOptions).loginHint;

    if (flow === 'popup') {
      return this.signInWithPopup(loginHint);
    }
    return this.signInWithOneTap(flow === 'auto', loginHint);
  }

  /**
   * Renders Google's official "Sign in with Google" button into `parent`. Use this when you want
   * Google's branded button rather than your own. It uses the SAME credential callback, so a click
   * resolves the most recent (or next) {@link signIn} promise with the ID-token credential.
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
    this.lastCredential = null;
    await this.clearStoredData();
    await this.setCurrentUser(null);
  }

  /**
   * Web tokens cannot be refreshed silently without a backend — re-running the configured flow
   * (One-Tap auto-select for a returning user, or the popup) re-issues a fresh credential.
   */
  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    return this.signIn();
  }

  /**
   * Returns the ID token from the current page session. `forceRefresh` (or an expired token) re-runs
   * One-Tap. Throws `NO_AUTH_SESSION` when the last sign-in was the popup flow, which issues no ID token.
   */
  async getIdToken(forceRefresh = false): Promise<string> {
    const cached = this.lastCredential;
    const expired =
      typeof cached?.expiresAt === 'number' && cached.expiresAt <= Date.now();
    if (cached?.idToken && !forceRefresh && !expired) {
      return cached.idToken;
    }
    if (cached && !cached.idToken && !forceRefresh) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'The popup flow issues an access token, not an ID token. Use result.credential.accessToken, or sign in with webFlow "one-tap".',
        AuthProvider.GOOGLE
      );
    }
    const result = await this.signInWithOneTap(false);
    if (!result.credential.idToken) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No Google ID token available',
        AuthProvider.GOOGLE
      );
    }
    return result.credential.idToken;
  }

  async revokeAccess(token?: string): Promise<void> {
    const accessToken = token ?? this.lastCredential?.accessToken;
    const oauth2 = window.google?.accounts?.oauth2;
    if (accessToken && oauth2) {
      await new Promise<void>((resolve) => {
        try {
          oauth2.revoke(accessToken, () => resolve());
        } catch {
          resolve();
        }
      });
      await this.signOut();
      return;
    }
    const user = this.currentUser ?? (await this.getCurrentUser());
    const hint = user?.email ?? token;
    if (hint) {
      await new Promise<void>((resolve) => {
        try {
          this.requireIdApi().revoke(hint, () => resolve());
        } catch {
          resolve();
        }
      });
    }
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

  // --- One-Tap flow --------------------------------------------------------------------------------

  private signInWithOneTap(
    fallbackToPopup: boolean,
    loginHint?: string
  ): Promise<AuthResult> {
    this.configureIdClient(loginHint);

    return new Promise<AuthResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = (e) => reject(e);

      const fallback = (reason: string) => {
        this.logger.info(
          `Google One-Tap not shown (${reason}); using the popup flow`
        );
        // Drop the One-Tap resolvers so a late credential callback cannot double-resolve.
        this.pendingResolve = null;
        this.pendingReject = null;
        this.signInWithPopup(loginHint).then(resolve, reject);
      };

      try {
        this.requireIdApi().prompt((notification: PromptMomentNotification) => {
          // These moment methods are deprecated under FedCM and may throw — guard every call.
          try {
            const notDisplayed = notification.isNotDisplayed?.() ?? false;
            const skipped = notification.isSkippedMoment?.() ?? false;
            if (notDisplayed || skipped) {
              const reason =
                notification.getNotDisplayedReason?.() ??
                notification.getSkippedReason?.() ??
                'suppressed';
              if (fallbackToPopup) {
                fallback(reason);
              } else {
                this.rejectPending(
                  new AuthError(
                    AuthErrorCode.POPUP_BLOCKED,
                    `Google One-Tap was not displayed (${reason}). Use webFlow 'popup' or 'auto', or ` +
                      `render Google's button via provider.renderButton(element).`,
                    AuthProvider.GOOGLE
                  )
                );
              }
              return;
            }
            const dismissed = notification.isDismissedMoment?.() ?? false;
            if (dismissed) {
              const reason = notification.getDismissedReason?.() ?? '';
              // 'credential_returned' is the success path — the credential callback resolves it.
              if (reason !== 'credential_returned') {
                this.rejectPending(
                  new AuthError(
                    AuthErrorCode.USER_CANCELLED,
                    `Google One-Tap was dismissed (${reason || 'cancelled'})`,
                    AuthProvider.GOOGLE
                  )
                );
              }
            }
          } catch {
            // FedCM: moment methods unavailable — wait for the credential callback instead.
          }
        });
      } catch (error) {
        if (fallbackToPopup) {
          fallback(error instanceof Error ? error.message : 'prompt failed');
        } else {
          this.rejectPending(AuthError.fromError(error, AuthProvider.GOOGLE));
        }
      }
    });
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
        expiresAt:
          typeof claims.exp === 'number' ? claims.exp * 1000 : undefined,
        tokenType: 'Bearer',
        scope: DEFAULT_SCOPES.join(' '),
      };
      this.lastCredential = credential;
      await this.setCurrentUser(user);
      this.resolvePending(this.createAuthResult(user, credential, false));
    } catch (error) {
      this.rejectPending(AuthError.fromError(error, AuthProvider.GOOGLE));
    }
  }

  // --- OAuth2 popup flow ---------------------------------------------------------------------------

  private async signInWithPopup(loginHint?: string): Promise<AuthResult> {
    const options = this.options as GoogleAuthOptions;
    const clientId = this.requireClientId();
    await this.loadGsi();
    const oauth2 = window.google?.accounts?.oauth2;
    if (!oauth2) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_NOT_INITIALIZED,
        'Google Identity Services OAuth2 client not loaded',
        AuthProvider.GOOGLE
      );
    }

    const scopes = Array.from(
      new Set([...DEFAULT_SCOPES, ...(options.scopes ?? [])])
    );

    const tokenResponse = await new Promise<GoogleTokenResponse>(
      (resolve, reject) => {
        try {
          const client = oauth2.initTokenClient({
            client_id: clientId,
            scope: scopes.join(' '),
            hint: loginHint,
            hosted_domain: options.hostedDomain,
            include_granted_scopes: options.includeGrantedScopes ?? true,
            callback: (response) => {
              if (response.error) {
                reject(
                  new AuthError(
                    response.error === 'access_denied'
                      ? AuthErrorCode.USER_CANCELLED
                      : AuthErrorCode.SIGN_IN_FAILED,
                    response.error_description || response.error,
                    AuthProvider.GOOGLE
                  )
                );
                return;
              }
              resolve(response);
            },
            error_callback: (error) => {
              const type = error?.type ?? 'unknown';
              reject(
                new AuthError(
                  type === 'popup_closed'
                    ? AuthErrorCode.POPUP_CLOSED_BY_USER
                    : type === 'popup_failed_to_open'
                      ? AuthErrorCode.POPUP_BLOCKED
                      : AuthErrorCode.SIGN_IN_FAILED,
                  error?.message || `Google sign-in popup failed (${type})`,
                  AuthProvider.GOOGLE
                )
              );
            },
          });
          client.requestAccessToken({
            prompt: options.autoSelectEnabled ? '' : 'select_account',
          });
        } catch (error) {
          reject(AuthError.fromError(error, AuthProvider.GOOGLE));
        }
      }
    );

    const accessToken = tokenResponse.access_token;
    if (!accessToken) {
      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        'Google returned no access token',
        AuthProvider.GOOGLE
      );
    }

    const profile = await this.fetchUserInfo(accessToken);
    if (options.hostedDomain && profile.hd !== options.hostedDomain) {
      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        `Account is not in the required Google Workspace domain (${options.hostedDomain})`,
        AuthProvider.GOOGLE
      );
    }

    const user = this.buildUser(profile);
    const expiresIn = Number(tokenResponse.expires_in);
    const credential: AuthCredential = {
      providerId: 'google.com',
      signInMethod: 'google.com',
      accessToken,
      expiresAt: this.calculateTokenExpiry(
        Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : undefined
      ),
      tokenType: tokenResponse.token_type || 'Bearer',
      scope: tokenResponse.scope || scopes.join(' '),
    };
    this.lastCredential = credential;
    await this.setCurrentUser(user);
    return this.createAuthResult(user, credential, false);
  }

  private async fetchUserInfo(
    accessToken: string
  ): Promise<GoogleProfileClaims> {
    let response: Response;
    try {
      response = await fetch(USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        `Could not reach Google userinfo: ${error instanceof Error ? error.message : String(error)}`,
        AuthProvider.GOOGLE
      );
    }
    if (!response.ok) {
      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        `Google userinfo request failed (${response.status})`,
        AuthProvider.GOOGLE
      );
    }
    return (await response.json()) as GoogleProfileClaims;
  }

  // --- internals -----------------------------------------------------------------------------------

  private requireClientId(): string {
    const options = this.options as GoogleAuthOptions;
    if (!options?.clientId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'Google web sign-in requires a `clientId` (your OAuth 2.0 Web client ID).',
        AuthProvider.GOOGLE
      );
    }
    return options.clientId;
  }

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

  private configureIdClient(loginHint?: string): void {
    const options = this.options as GoogleAuthOptions;
    const clientId = this.requireClientId();
    this.currentNonce = options.nonce;
    const config: GoogleIdConfig = {
      client_id: clientId,
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
    const hint = loginHint ?? options.loginHint;
    if (hint) {
      config.login_hint = hint;
    }
    if (options.hostedDomain) {
      config.hd = options.hostedDomain;
    }
    this.requireIdApi().initialize(config);
  }

  private validateIdToken(idToken: string): GoogleProfileClaims {
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

  private buildUser(claims: GoogleProfileClaims): AuthUser {
    const uid = claims.sub || this.generateUniqueId();
    const email = claims.email ?? null;
    const emailVerified =
      claims.email_verified === true || claims.email_verified === 'true';
    const displayName =
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(' ') ||
      null;
    const photoURL = claims.picture ?? null;
    const now = new Date().toISOString();
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
        creationTime: now,
        lastSignInTime: now,
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
function decodeJwtPayload(jwt: string): GoogleProfileClaims {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new AuthError(
      AuthErrorCode.INVALID_TOKEN,
      'Malformed Google ID token',
      AuthProvider.GOOGLE
    );
  }
  if (typeof atob !== 'function') {
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
  return JSON.parse(json) as GoogleProfileClaims;
}
