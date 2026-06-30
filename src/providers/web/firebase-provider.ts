import { BaseAuthProvider } from '../base-provider';
import {
  AuthResult,
  AuthErrorCode,
  AuthUser,
  AuthCredential,
  FirebaseAuthOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
} from '../../definitions';
import { AuthError } from '../../utils/auth-error';
import type { SignInOptions, SignOutOptions } from '../../definitions';

/**
 * Minimal structural types for the slices of the Firebase compat ("namespaced") Web SDK this
 * provider actually touches. The Firebase SDK is loaded by the host page (`window.firebase`); we
 * type only what we use and cast the `window` boundary ONCE (see {@link getFirebase}) — mirroring
 * the typed-CDN-boundary pattern in `google-provider.ts`. This is intentionally partial, not a
 * full mirror of the Firebase typings.
 */
interface FirebaseUserCompat {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  isAnonymous: boolean;
  tenantId: string | null;
  refreshToken: string;
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }>;
  metadata: { creationTime?: string; lastSignInTime?: string };
  getIdToken(forceRefresh?: boolean): Promise<string>;
  getIdTokenResult(): Promise<{
    claims: Record<string, string | number | boolean | null>;
  }>;
  linkWithPopup(provider: unknown): Promise<FirebaseUserCredentialCompat>;
  linkWithCredential(credential: unknown): Promise<FirebaseUserCredentialCompat>;
  unlink(providerId: string): Promise<unknown>;
}

interface FirebaseAuthCredentialCompat {
  providerId?: string;
  signInMethod?: string;
  accessToken?: string;
  nonce?: string;
}

interface FirebaseUserCredentialCompat {
  user: FirebaseUserCompat;
  credential: FirebaseAuthCredentialCompat | null;
  additionalUserInfo?: { isNewUser?: boolean; providerId?: string };
}

interface FirebaseOAuthProviderCompat {
  addScope(scope: string): void;
}

interface FirebaseAuthCompat {
  currentUser: FirebaseUserCompat | null;
  setPersistence(mode: unknown): Promise<void>;
  onAuthStateChanged(cb: (user: FirebaseUserCompat | null) => void): () => void;
  signInWithPopup(provider: unknown): Promise<FirebaseUserCredentialCompat>;
  signInWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<FirebaseUserCredentialCompat>;
  signInAnonymously(): Promise<FirebaseUserCredentialCompat>;
  signOut(): Promise<void>;
}

interface FirebaseAppCompat {
  name: string;
}

interface FirebaseNamespaceCompat {
  apps: FirebaseAppCompat[];
  app(): FirebaseAppCompat;
  initializeApp(config: Record<string, unknown>): FirebaseAppCompat;
  auth: ((app?: FirebaseAppCompat) => FirebaseAuthCompat) & {
    Auth: { Persistence: { LOCAL: unknown; SESSION: unknown; NONE: unknown } };
    GoogleAuthProvider: new () => FirebaseOAuthProviderCompat;
    FacebookAuthProvider: new () => FirebaseOAuthProviderCompat;
    GithubAuthProvider: new () => FirebaseOAuthProviderCompat;
    OAuthProvider: new (providerId: string) => FirebaseOAuthProviderCompat;
    EmailAuthProvider: {
      credential(email: string, password: string): unknown;
    };
  };
}

/** A thrown value that may carry a Firebase error `code`/`message`. */
interface FirebaseErrorLike {
  code?: string;
  message?: string;
}

export class FirebaseAuthProviderWeb extends BaseAuthProvider {
  private firebaseApp: FirebaseAppCompat | undefined;
  private firebaseAuth!: FirebaseAuthCompat;
  private unsubscribeAuth: (() => void) | null = null;

  /** Reads the host-page Firebase SDK, casting the `window` boundary exactly once. */
  private getFirebase(): FirebaseNamespaceCompat | undefined {
    return (window as unknown as { firebase?: FirebaseNamespaceCompat })
      .firebase;
  }

  async initialize(): Promise<void> {
    const options = this.options as FirebaseAuthOptions;

    if (!options.apiKey || !options.authDomain || !options.projectId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIG,
        'Firebase configuration (apiKey, authDomain, projectId) is required',
        this.provider
      );
    }

    try {
      // Check if Firebase is available
      const firebase = this.getFirebase();
      if (!firebase) {
        throw new AuthError(
          AuthErrorCode.PROVIDER_NOT_INITIALIZED,
          'Firebase SDK is not loaded. Please include the Firebase scripts in your HTML.',
          this.provider
        );
      }

      // Initialize Firebase app
      const firebaseConfig = {
        apiKey: options.apiKey,
        authDomain: options.authDomain,
        projectId: options.projectId,
        storageBucket: options.storageBucket,
        messagingSenderId: options.messagingSenderId,
        appId: options.appId,
        measurementId: options.measurementId,
      };

      // Check if app already exists
      this.firebaseApp =
        firebase.apps.length > 0
          ? firebase.app()
          : firebase.initializeApp(firebaseConfig);

      this.firebaseAuth = firebase.auth(this.firebaseApp);

      // Configure persistence
      const persistenceMode = this.getPersistenceMode();
      await this.firebaseAuth.setPersistence(persistenceMode);

      // Set up auth state listener
      this.unsubscribeAuth = this.firebaseAuth.onAuthStateChanged(
        async (firebaseUser: FirebaseUserCompat | null) => {
          if (firebaseUser) {
            const user = await this.createUserFromFirebaseUser(firebaseUser);
            await this.setCurrentUser(user);
          } else {
            await this.setCurrentUser(null);
          }
        }
      );

      // Wait for auth state to be determined
      await new Promise((resolve) => {
        const unsubscribe = this.firebaseAuth.onAuthStateChanged(() => {
          unsubscribe();
          resolve(undefined);
        });
      });

      this.isInitialized = true;
      this.logger.info('Firebase auth provider initialized');
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_INIT_FAILED,
        `Failed to initialize Firebase auth: ${error}`,
        this.provider
      );
    }
  }

  private getPersistenceMode(): unknown {
    const firebase = this.getFirebase();
    const persistence = firebase?.auth.Auth.Persistence;
    switch (this.persistence) {
      case 'session':
        return persistence?.SESSION;
      case 'none':
        return persistence?.NONE;
      default:
        return persistence?.LOCAL;
    }
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    // The manager spreads credentials to the top level AND nests them under `credentials`,
    // and spreads `options.*` (scopes, prompt, etc.) to the top level too. Derive the
    // Firebase sub-method from the STANDARD shape instead of an undocumented `options.method`.
    const raw = (options as Record<string, unknown> | undefined) || {};
    const nestedOptions =
      (raw.options as Record<string, unknown> | undefined) || {};
    const credentials =
      (raw.credentials as Record<string, unknown> | undefined) || {};

    // email/password may arrive nested under `credentials` or spread to the top level.
    const email = (credentials.email ?? raw.email) as string | undefined;
    const password = (credentials.password ?? raw.password) as
      | string
      | undefined;
    const scopes = (nestedOptions.scopes ?? raw.scopes) as string[] | undefined;

    const firebaseOptions = this.options as FirebaseAuthOptions;
    const method = (nestedOptions.method ??
      raw.method ??
      (email && password
        ? 'email'
        : firebaseOptions.defaultMethod || 'google')) as string;

    const signInOptions = { method, email, password, scopes };

    const firebase = this.getFirebase();
    if (!firebase) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_NOT_INITIALIZED,
        'Firebase SDK is not loaded.',
        this.provider
      );
    }

    const applyScopes = (provider: FirebaseOAuthProviderCompat): void => {
      if (signInOptions.scopes) {
        signInOptions.scopes.forEach((scope: string) =>
          provider.addScope(scope)
        );
      }
    };

    try {
      let firebaseUser: FirebaseUserCompat;
      let credential: FirebaseAuthCredentialCompat | null;
      let additionalUserInfo: { isNewUser?: boolean; providerId?: string };

      // Determine sign-in method
      if (signInOptions.method === 'google') {
        const provider = new firebase.auth.GoogleAuthProvider();
        applyScopes(provider);
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo ?? {};
      } else if (signInOptions.method === 'facebook') {
        const provider = new firebase.auth.FacebookAuthProvider();
        applyScopes(provider);
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo ?? {};
      } else if (signInOptions.method === 'github') {
        const provider = new firebase.auth.GithubAuthProvider();
        applyScopes(provider);
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo ?? {};
      } else if (signInOptions.method === 'microsoft') {
        const provider = new firebase.auth.OAuthProvider('microsoft.com');
        applyScopes(provider);
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo ?? {};
      } else if (signInOptions.method === 'apple') {
        const provider = new firebase.auth.OAuthProvider('apple.com');
        applyScopes(provider);
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo ?? {};
      } else if (
        signInOptions.method === 'email' &&
        signInOptions.email &&
        signInOptions.password
      ) {
        const result = await this.firebaseAuth.signInWithEmailAndPassword(
          signInOptions.email,
          signInOptions.password
        );
        firebaseUser = result.user;
        credential = {
          providerId: 'password',
          signInMethod: 'password',
        };
        additionalUserInfo = { isNewUser: false, providerId: 'password' };
      } else if (signInOptions.method === 'anonymous') {
        const result = await this.firebaseAuth.signInAnonymously();
        firebaseUser = result.user;
        credential = {
          providerId: 'anonymous',
          signInMethod: 'anonymous',
        };
        additionalUserInfo = { isNewUser: true, providerId: 'anonymous' };
      } else {
        throw new AuthError(
          AuthErrorCode.INVALID_REQUEST,
          'Invalid sign-in method or missing credentials',
          this.provider
        );
      }

      const user = await this.createUserFromFirebaseUser(firebaseUser);
      const authCredential = await this.createCredentialFromFirebase(
        credential,
        firebaseUser
      );

      await this.saveCredential(authCredential);

      return this.createAuthResult(
        user,
        authCredential,
        additionalUserInfo?.isNewUser || false
      );
    } catch (error) {
      this.logger.error('Firebase sign in failed', error);
      const err = error as FirebaseErrorLike;

      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        throw new AuthError(
          AuthErrorCode.USER_CANCELLED,
          'User cancelled the sign in',
          this.provider
        );
      }

      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        `Firebase sign in failed: ${err.message}`,
        this.provider
      );
    }
  }

  async signOut(options?: SignOutOptions): Promise<void> {
    this.validateInitialized();

    try {
      await this.firebaseAuth.signOut();

      if (options?.redirectUrl) {
        window.location.href = options.redirectUrl;
      }
    } catch (error) {
      this.logger.error('Firebase sign out failed', error);
      throw new AuthError(
        AuthErrorCode.SIGN_OUT_FAILED,
        `Firebase sign out failed: ${error}`,
        this.provider
      );
    }
  }

  async refreshToken(): Promise<AuthResult> {
    this.validateInitialized();

    try {
      const currentUser = this.firebaseAuth.currentUser;
      if (!currentUser) {
        throw new AuthError(
          AuthErrorCode.NO_AUTH_SESSION,
          'No active Firebase session',
          this.provider
        );
      }

      // Force token refresh
      const idToken = await currentUser.getIdToken(true);

      const user = await this.createUserFromFirebaseUser(currentUser);
      const credential = {
        providerId: this.provider,
        signInMethod: 'firebase',
        idToken: idToken,
        accessToken: undefined,
        refreshToken: currentUser.refreshToken,
        expiresAt: undefined, // Firebase handles token expiry internally
        tokenType: 'Bearer',
      };

      await this.saveCredential(credential);

      return this.createAuthResult(user, credential, false);
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new AuthError(
        AuthErrorCode.TOKEN_REFRESH_FAILED,
        `Token refresh failed: ${error}`,
        this.provider
      );
    }
  }

  async isSupported(): Promise<boolean> {
    return typeof window !== 'undefined' && !!this.getFirebase();
  }

  async linkAccount(options: LinkAccountOptions): Promise<AuthResult> {
    this.validateInitialized();

    const currentUser = this.firebaseAuth.currentUser;
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No active session to link account to',
        this.provider
      );
    }

    const firebase = this.getFirebase();
    if (!firebase) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_NOT_INITIALIZED,
        'Firebase SDK is not loaded.',
        this.provider
      );
    }

    // `method`/`email`/`password` may arrive nested under credentials or in provider options.
    const raw = options as unknown as Record<string, unknown>;
    const creds = (raw.credentials as Record<string, unknown> | undefined) ?? {};
    const method = (raw.method ?? creds.method) as string | undefined;
    const linkEmail = (creds.email ?? raw.email) as string | undefined;
    const linkPassword = (creds.password ?? raw.password) as string | undefined;

    try {
      let result: FirebaseUserCredentialCompat;

      if (method === 'google') {
        const provider = new firebase.auth.GoogleAuthProvider();
        result = await currentUser.linkWithPopup(provider);
      } else if (method === 'email' && linkEmail && linkPassword) {
        const credential = firebase.auth.EmailAuthProvider.credential(
          linkEmail,
          linkPassword
        );
        result = await currentUser.linkWithCredential(credential);
      } else {
        throw new AuthError(
          AuthErrorCode.INVALID_REQUEST,
          'Invalid link method or missing credentials',
          this.provider
        );
      }

      const user = await this.createUserFromFirebaseUser(result.user);
      const authCredential = await this.createCredentialFromFirebase(
        result.credential,
        result.user
      );

      return this.createAuthResult(user, authCredential, false, 'link');
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        `Failed to link account: ${(error as FirebaseErrorLike).message}`,
        this.provider
      );
    }
  }

  async unlinkAccount(options: UnlinkAccountOptions): Promise<void> {
    this.validateInitialized();

    const currentUser = this.firebaseAuth.currentUser;
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No active session',
        this.provider
      );
    }

    try {
      await currentUser.unlink(options.provider);
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        `Failed to unlink account: ${(error as FirebaseErrorLike).message}`,
        this.provider
      );
    }
  }

  async revokeAccess(): Promise<void> {
    // Firebase doesn't support token revocation directly
    await this.signOut();
  }

  private async createUserFromFirebaseUser(
    firebaseUser: FirebaseUserCompat
  ): Promise<AuthUser> {
    const idTokenResult = await firebaseUser.getIdTokenResult();

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      isAnonymous: firebaseUser.isAnonymous,
      tenantId: firebaseUser.tenantId,
      providerData: firebaseUser.providerData.map((provider) => ({
        providerId: provider.providerId,
        uid: provider.uid,
        displayName: provider.displayName,
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        photoURL: provider.photoURL,
      })),
      metadata: {
        creationTime: firebaseUser.metadata.creationTime,
        lastSignInTime: firebaseUser.metadata.lastSignInTime,
      },
      customClaims: idTokenResult.claims,
      refreshToken: firebaseUser.refreshToken,
    };
  }

  private async createCredentialFromFirebase(
    credential: FirebaseAuthCredentialCompat | null,
    user: FirebaseUserCompat
  ): Promise<AuthCredential> {
    const idToken = await user.getIdToken();

    return {
      providerId: credential?.providerId || this.provider,
      signInMethod: credential?.signInMethod || 'firebase',
      accessToken: credential?.accessToken,
      idToken: idToken,
      refreshToken: user.refreshToken,
      expiresAt: undefined, // Firebase manages token expiry
      tokenType: 'Bearer',
      rawNonce: credential?.nonce,
    };
  }

  dispose(): void {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
    super.dispose();
  }
}
