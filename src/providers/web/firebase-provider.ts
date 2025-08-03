import { BaseAuthProvider } from '../base-provider';
import { AuthResult, AuthErrorCode, FirebaseAuthOptions } from '../../definitions';
import { AuthError } from '../../utils/auth-error';
import type { SignInOptions, SignOutOptions } from '../../definitions';

export class FirebaseAuthProviderWeb extends BaseAuthProvider {
  private firebaseApp: any;
  private firebaseAuth: any;
  private unsubscribeAuth: (() => void) | null = null;

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
      const firebase = (window as any).firebase;
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
      this.firebaseApp = firebase.apps.length > 0 
        ? firebase.app() 
        : firebase.initializeApp(firebaseConfig);

      this.firebaseAuth = firebase.auth(this.firebaseApp);

      // Configure persistence
      const persistenceMode = this.getPersistenceMode();
      await this.firebaseAuth.setPersistence(persistenceMode);

      // Set up auth state listener
      this.unsubscribeAuth = this.firebaseAuth.onAuthStateChanged(async (firebaseUser: any) => {
        if (firebaseUser) {
          const user = await this.createUserFromFirebaseUser(firebaseUser);
          await this.setCurrentUser(user);
        } else {
          await this.setCurrentUser(null);
        }
      });

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

  private getPersistenceMode(): any {
    const firebase = (window as any).firebase;
    switch (this.persistence) {
      case 'session':
        return firebase.auth.Auth.Persistence.SESSION;
      case 'none':
        return firebase.auth.Auth.Persistence.NONE;
      default:
        return firebase.auth.Auth.Persistence.LOCAL;
    }
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    const signInOptions = options as any || {};
    
    try {
      let firebaseUser: any;
      let credential: any;
      let additionalUserInfo: any;

      // Determine sign-in method
      if (signInOptions.method === 'google') {
        const provider = new (window as any).firebase.auth.GoogleAuthProvider();
        if (signInOptions.scopes) {
          signInOptions.scopes.forEach((scope: string) => provider.addScope(scope));
        }
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo;
      } else if (signInOptions.method === 'facebook') {
        const provider = new (window as any).firebase.auth.FacebookAuthProvider();
        if (signInOptions.scopes) {
          signInOptions.scopes.forEach((scope: string) => provider.addScope(scope));
        }
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo;
      } else if (signInOptions.method === 'github') {
        const provider = new (window as any).firebase.auth.GithubAuthProvider();
        if (signInOptions.scopes) {
          signInOptions.scopes.forEach((scope: string) => provider.addScope(scope));
        }
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo;
      } else if (signInOptions.method === 'microsoft') {
        const provider = new (window as any).firebase.auth.OAuthProvider('microsoft.com');
        if (signInOptions.scopes) {
          signInOptions.scopes.forEach((scope: string) => provider.addScope(scope));
        }
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo;
      } else if (signInOptions.method === 'apple') {
        const provider = new (window as any).firebase.auth.OAuthProvider('apple.com');
        if (signInOptions.scopes) {
          signInOptions.scopes.forEach((scope: string) => provider.addScope(scope));
        }
        const result = await this.firebaseAuth.signInWithPopup(provider);
        firebaseUser = result.user;
        credential = result.credential;
        additionalUserInfo = result.additionalUserInfo;
      } else if (signInOptions.method === 'email' && signInOptions.email && signInOptions.password) {
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
          AuthErrorCode.INVALID_ARGUMENT,
          'Invalid sign-in method or missing credentials',
          this.provider
        );
      }

      const user = await this.createUserFromFirebaseUser(firebaseUser);
      const authCredential = await this.createCredentialFromFirebase(credential, firebaseUser);
      
      await this.saveCredential(authCredential);

      return this.createAuthResult(
        user,
        authCredential,
        additionalUserInfo?.isNewUser || false
      );
    } catch (error: any) {
      this.logger.error('Firebase sign in failed', error);
      
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        throw new AuthError(
          AuthErrorCode.USER_CANCELLED,
          'User cancelled the sign in',
          this.provider
        );
      }
      
      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        `Firebase sign in failed: ${error.message}`,
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
    return typeof window !== 'undefined' && !!(window as any).firebase;
  }

  async linkAccount(options: any): Promise<AuthResult> {
    this.validateInitialized();

    const currentUser = this.firebaseAuth.currentUser;
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No active session to link account to',
        this.provider
      );
    }

    try {
      let result: any;
      
      if (options.method === 'google') {
        const provider = new (window as any).firebase.auth.GoogleAuthProvider();
        result = await currentUser.linkWithPopup(provider);
      } else if (options.method === 'email' && options.email && options.password) {
        const credential = (window as any).firebase.auth.EmailAuthProvider.credential(
          options.email,
          options.password
        );
        result = await currentUser.linkWithCredential(credential);
      } else {
        throw new AuthError(
          AuthErrorCode.INVALID_ARGUMENT,
          'Invalid link method or missing credentials',
          this.provider
        );
      }

      const user = await this.createUserFromFirebaseUser(result.user);
      const authCredential = await this.createCredentialFromFirebase(result.credential, result.user);

      return this.createAuthResult(user, authCredential, false, 'link');
    } catch (error: any) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        `Failed to link account: ${error.message}`,
        this.provider
      );
    }
  }

  async unlinkAccount(options: any): Promise<void> {
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
      await currentUser.unlink(options.providerId);
    } catch (error: any) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        `Failed to unlink account: ${error.message}`,
        this.provider
      );
    }
  }

  async revokeAccess(): Promise<void> {
    // Firebase doesn't support token revocation directly
    await this.signOut();
  }

  private async createUserFromFirebaseUser(firebaseUser: any): Promise<any> {
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
      providerData: firebaseUser.providerData.map((provider: any) => ({
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

  private async createCredentialFromFirebase(credential: any, user: any): Promise<any> {
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