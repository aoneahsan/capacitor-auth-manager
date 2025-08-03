import { BaseAuthProvider } from '../base-provider';
import { AuthResult, AuthErrorCode, FacebookAuthOptions } from '../../definitions';
import { AuthError } from '../../utils/auth-error';
import type { SignInOptions, SignOutOptions } from '../../definitions';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export class FacebookAuthProviderWeb extends BaseAuthProvider {
  private appId: string;
  private version: string;
  private scopes: string[];
  private fields: string[];
  private fbInitialized = false;

  async initialize(): Promise<void> {
    const options = this.options as FacebookAuthOptions;
    
    if (!options.appId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIG,
        'Facebook App ID is required',
        this.provider
      );
    }

    this.appId = options.appId;
    this.version = options.version || 'v18.0';
    this.scopes = options.scopes || ['email', 'public_profile'];
    this.fields = options.fields || ['id', 'name', 'email', 'picture.type(large)'];

    try {
      await this.loadFacebookSDK();
      await this.initializeFacebookSDK();
      
      // Check login status
      await this.checkLoginStatus();
      
      this.isInitialized = true;
      this.logger.info('Facebook auth provider initialized');
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_INIT_FAILED,
        `Failed to initialize Facebook auth: ${error}`,
        this.provider
      );
    }
  }

  private loadFacebookSDK(): Promise<void> {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.FB) {
        resolve();
        return;
      }

      // Check if script is already loading
      const existingScript = document.getElementById('facebook-jssdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      // Load the SDK
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = `https://connect.facebook.net/en_US/sdk.js`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      
      document.head.appendChild(script);
    });
  }

  private initializeFacebookSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.fbAsyncInit = () => {
        try {
          window.FB.init({
            appId: this.appId,
            cookie: true,
            xfbml: false,
            version: this.version,
          });

          this.fbInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      // If FB is already loaded, trigger init
      if (window.FB && !this.fbInitialized) {
        window.fbAsyncInit();
      }
    });
  }

  private checkLoginStatus(): Promise<void> {
    return new Promise((resolve) => {
      window.FB.getLoginStatus(async (response: any) => {
        if (response.status === 'connected') {
          await this.handleAuthResponse(response.authResponse);
        }
        resolve();
      });
    });
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    return new Promise((resolve, reject) => {
      window.FB.login(async (response: any) => {
        if (response.authResponse) {
          try {
            const result = await this.handleAuthResponse(response.authResponse);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        } else if (response.status === 'unknown') {
          reject(new AuthError(
            AuthErrorCode.USER_CANCELLED,
            'User cancelled the sign in',
            this.provider
          ));
        } else {
          reject(new AuthError(
            AuthErrorCode.SIGN_IN_FAILED,
            'Facebook sign in failed',
            this.provider
          ));
        }
      }, { scope: this.scopes.join(','), auth_type: options?.authType });
    });
  }

  async signOut(options?: SignOutOptions): Promise<void> {
    this.validateInitialized();

    return new Promise((resolve, reject) => {
      window.FB.logout(async () => {
        try {
          await this.setCurrentUser(null);
          await this.clearStoredData();
          
          if (options?.redirectUrl) {
            window.location.href = options.redirectUrl;
          }
          
          resolve();
        } catch (error) {
          reject(new AuthError(
            AuthErrorCode.SIGN_OUT_FAILED,
            `Facebook sign out failed: ${error}`,
            this.provider
          ));
        }
      });
    });
  }

  async refreshToken(): Promise<AuthResult> {
    this.validateInitialized();

    // Facebook access tokens are short-lived and need to be refreshed via re-authentication
    return new Promise((resolve, reject) => {
      window.FB.getLoginStatus(async (response: any) => {
        if (response.status === 'connected') {
          try {
            const result = await this.handleAuthResponse(response.authResponse, true);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        } else {
          // Token expired, need to re-authenticate
          this.signIn().then(resolve).catch(reject);
        }
      }, true); // Force fresh status check
    });
  }

  async isSupported(): Promise<boolean> {
    return typeof window !== 'undefined';
  }

  async linkAccount(): Promise<AuthResult> {
    // Facebook doesn't support account linking in the traditional sense
    // Re-authenticate to ensure current credentials
    return await this.signIn();
  }

  async unlinkAccount(): Promise<void> {
    // Facebook doesn't support unlinking without app management
    // Best we can do is sign out
    await this.signOut();
  }

  async revokeAccess(): Promise<void> {
    this.validateInitialized();

    return new Promise((resolve, reject) => {
      window.FB.api('/me/permissions', 'DELETE', async (response: any) => {
        if (response.success) {
          try {
            await this.setCurrentUser(null);
            await this.clearStoredData();
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new AuthError(
            AuthErrorCode.INTERNAL_ERROR,
            'Failed to revoke Facebook access',
            this.provider
          ));
        }
      });
    });
  }

  private async handleAuthResponse(authResponse: any, isRefresh = false): Promise<AuthResult> {
    // Get user data
    const userData = await this.getUserData(authResponse.accessToken);
    
    const user = {
      uid: authResponse.userID,
      email: userData.email || null,
      emailVerified: !!userData.email,
      displayName: userData.name || null,
      photoURL: userData.picture?.data?.url || null,
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerData: [{
        providerId: this.provider,
        uid: authResponse.userID,
        displayName: userData.name || null,
        email: userData.email || null,
        phoneNumber: null,
        photoURL: userData.picture?.data?.url || null,
      }],
      metadata: {
        creationTime: userData.created_time || undefined,
        lastSignInTime: new Date().toISOString(),
      },
    };

    await this.setCurrentUser(user);

    const credential = {
      providerId: this.provider,
      signInMethod: 'oauth',
      accessToken: authResponse.accessToken,
      idToken: authResponse.signedRequest,
      refreshToken: undefined, // Facebook doesn't provide refresh tokens
      expiresAt: authResponse.expiresIn ? Date.now() + (authResponse.expiresIn * 1000) : undefined,
      tokenType: 'bearer',
      scope: this.scopes.join(' '),
    };

    await this.saveCredential(credential);

    return this.createAuthResult(
      user,
      credential,
      !isRefresh && !userData.created_time
    );
  }

  private getUserData(accessToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      window.FB.api(
        '/me',
        { fields: this.fields.join(','), access_token: accessToken },
        (response: any) => {
          if (response.error) {
            reject(new AuthError(
              AuthErrorCode.INTERNAL_ERROR,
              `Failed to get user data: ${response.error.message}`,
              this.provider
            ));
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}