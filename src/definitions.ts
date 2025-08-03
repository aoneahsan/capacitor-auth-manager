import type { PluginListenerHandle } from '@capacitor/core';

export interface CapacitorAuthManagerPlugin {
  initialize(options: AuthManagerInitOptions): Promise<void>;
  signIn(options: SignInOptions): Promise<AuthResult>;
  signOut(options?: SignOutOptions): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshToken(options?: RefreshTokenOptions): Promise<AuthResult>;
  addAuthStateListener(
    callback: AuthStateChangeCallback
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
  isSupported(options: IsSupportedOptions): Promise<IsSupportedResult>;
  configure(options: ConfigureOptions): Promise<void>;
  linkAccount(options: LinkAccountOptions): Promise<AuthResult>;
  unlinkAccount(options: UnlinkAccountOptions): Promise<void>;
  sendPasswordResetEmail(options: PasswordResetOptions): Promise<void>;
  sendEmailVerification(options?: EmailVerificationOptions): Promise<void>;
  sendSmsCode(options: SendSmsCodeOptions): Promise<void>;
  verifySmsCode(options: VerifySmsCodeOptions): Promise<AuthResult>;
  sendEmailCode(options: SendEmailCodeOptions): Promise<void>;
  verifyEmailCode(options: VerifyEmailCodeOptions): Promise<AuthResult>;
  updateProfile(options: UpdateProfileOptions): Promise<AuthUser>;
  deleteAccount(options?: DeleteAccountOptions): Promise<void>;
  getIdToken(options?: GetIdTokenOptions): Promise<string>;
  setCustomParameters(options: SetCustomParametersOptions): Promise<void>;
  revokeAccess(options?: RevokeAccessOptions): Promise<void>;
}

export interface AuthManagerInitOptions {
  providers: AuthProviderConfig[];
  persistence?: AuthPersistence;
  autoRefreshToken?: boolean;
  tokenRefreshBuffer?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface AuthProviderConfig {
  provider: AuthProvider;
  options: ProviderOptions;
}

export enum AuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  MICROSOFT = 'microsoft',
  FACEBOOK = 'facebook',
  GITHUB = 'github',
  SLACK = 'slack',
  LINKEDIN = 'linkedin',
  FIREBASE = 'firebase',
  EMAIL_MAGIC_LINK = 'email_magic_link',
  MAGIC_LINK = 'magic-link',
  SMS = 'sms',
  EMAIL_PASSWORD = 'email-password',
  PHONE_PASSWORD = 'phone_password',
  USERNAME_PASSWORD = 'username_password',
  EMAIL_CODE = 'email_code',
  BIOMETRIC = 'biometric',
}

// Additional provider values for backward compatibility
export const AUTH_PROVIDERS = {
  ...AuthProvider,
  'magic-link': AuthProvider.MAGIC_LINK,
  'email-password': AuthProvider.EMAIL_PASSWORD,
  sms: AuthProvider.SMS,
  biometric: AuthProvider.BIOMETRIC,
} as const;

export type ProviderOptions =
  | GoogleAuthOptions
  | AppleAuthOptions
  | MicrosoftAuthOptions
  | FacebookAuthOptions
  | GitHubAuthOptions
  | SlackAuthOptions
  | LinkedInAuthOptions
  | FirebaseAuthOptions
  | EmailMagicLinkOptions
  | SmsAuthOptions
  | EmailPasswordOptions
  | PhonePasswordOptions
  | UsernamePasswordOptions
  | EmailCodeOptions
  | BiometricAuthOptions;

export interface GoogleAuthOptions {
  clientId: string;
  clientSecret?: string;
  scopes?: string[];
  hostedDomain?: string;
  serverClientId?: string;
  offlineAccess?: boolean;
  forceCodeForRefreshToken?: boolean;
  accountName?: string;
  includeGrantedScopes?: boolean;
  loginHint?: string;
  requestIdToken?: boolean;
  requestServerAuthCode?: boolean;
}

export interface AppleAuthOptions {
  clientId: string;
  redirectUri: string;
  scopes?: AppleAuthScope[];
  usePopup?: boolean;
  state?: string;
  nonce?: string;
  responseMode?: 'query' | 'fragment' | 'form_post';
  responseType?: 'code' | 'id_token' | 'code id_token';
}

export enum AppleAuthScope {
  EMAIL = 'email',
  NAME = 'name',
}

export interface MicrosoftAuthOptions {
  clientId: string;
  clientSecret?: string;
  tenantId?: string;
  scopes?: string[];
  redirectUri: string;
  authority?: string;
  loginHint?: string;
  domainHint?: string;
  prompt?: 'login' | 'none' | 'consent' | 'select_account';
  responseType?: string;
  responseMode?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  state?: string;
  nonce?: string;
}

export interface FacebookAuthOptions {
  appId: string;
  appSecret?: string;
  scopes?: string[];
  fields?: string[];
  version?: string;
  loginBehavior?:
    | 'native_with_fallback'
    | 'native_only'
    | 'web_only'
    | 'web_view_only';
  defaultAudience?: 'friends' | 'only_me' | 'everyone';
  limitedLogin?: boolean;
  authType?: string;
  messengerPageId?: string;
  resetMessengerState?: boolean;
}

export interface GitHubAuthOptions {
  clientId: string;
  clientSecret?: string;
  scopes?: string[];
  redirectUri: string;
  allowSignup?: boolean;
  login?: string;
  state?: string;
}

export interface SlackAuthOptions {
  clientId: string;
  clientSecret?: string;
  scopes?: string[];
  redirectUri: string;
  teamId?: string;
  state?: string;
  nonce?: string;
}

export interface LinkedInAuthOptions {
  clientId: string;
  clientSecret?: string;
  scopes?: string[];
  redirectUri: string;
  state?: string;
}

export interface FirebaseAuthOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  tenantId?: string;
  persistence?: 'local' | 'session' | 'none';
  enableMultiTabSupport?: boolean;
}

export interface EmailMagicLinkOptions {
  endpoint?: string;
  apiKey?: string;
  redirectUrl?: string;
  customEmailTemplate?: string;
  tokenExpiration?: number;
  rateLimit?: {
    maxAttempts: number;
    windowMs: number;
  };
}

export interface SmsAuthOptions {
  provider: 'twilio' | 'firebase' | 'custom';
  twilioConfig?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  firebaseConfig?: {
    apiKey: string;
    projectId: string;
  };
  customConfig?: {
    endpoint: string;
    apiKey?: string;
    headers?: Record<string, string>;
  };
  codeLength?: number;
  codeExpiration?: number;
  maxAttempts?: number;
  testMode?: boolean;
  testPhoneNumbers?: Record<string, string>;
}

export interface EmailPasswordOptions {
  strengthRequirements?: PasswordStrengthRequirements;
  allowPasswordReset?: boolean;
  requireEmailVerification?: boolean;
  customValidation?: {
    endpoint?: string;
    headers?: Record<string, string>;
  };
}

export interface PhonePasswordOptions {
  strengthRequirements?: PasswordStrengthRequirements;
  allowPasswordReset?: boolean;
  requirePhoneVerification?: boolean;
  phoneNumberFormat?: 'E164' | 'NATIONAL' | 'INTERNATIONAL';
}

export interface UsernamePasswordOptions {
  strengthRequirements?: PasswordStrengthRequirements;
  allowPasswordReset?: boolean;
  usernameRequirements?: UsernameRequirements;
  caseSensitive?: boolean;
}

export interface EmailCodeOptions {
  codeLength?: number;
  codeExpiration?: number;
  maxAttempts?: number;
  customEmailTemplate?: string;
  rateLimit?: {
    maxAttempts: number;
    windowMs: number;
  };
}

export interface BiometricAuthOptions {
  fallbackToPasscode?: boolean;
  title?: string;
  subtitle?: string;
  description?: string;
  negativeButtonText?: string;
  maxAttempts?: number;
  requireConfirmation?: boolean;
  authenticatorTypes?: BiometricType[];
  allowedAuthenticators?: number;
}

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACE_ID = 'faceId',
  TOUCH_ID = 'touchId',
  IRIS = 'iris',
  VOICE = 'voice',
}

export interface PasswordStrengthRequirements {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialCharacters?: boolean;
  preventCommonPasswords?: boolean;
  customRegex?: string;
  customErrorMessage?: string;
}

export interface UsernameRequirements {
  minLength?: number;
  maxLength?: number;
  allowedCharacters?: string;
  preventProfanity?: boolean;
  uniqueCheck?: {
    endpoint: string;
    headers?: Record<string, string>;
  };
}

export interface SignInOptions {
  provider: AuthProvider;
  credentials?: AuthCredentials;
  options?: SignInProviderOptions;
}

export interface SignUpOptions {
  provider: AuthProvider;
  credentials?: AuthCredentials;
  options?: SignInProviderOptions;
}

export type AuthCredentials =
  | EmailPasswordCredentials
  | PhonePasswordCredentials
  | UsernamePasswordCredentials
  | EmailCodeCredentials
  | SmsCodeCredentials
  | BiometricCredentials
  | OAuthCredentials
  | CustomCredentials;

export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

export interface PhonePasswordCredentials {
  phoneNumber: string;
  password: string;
}

export interface UsernamePasswordCredentials {
  username: string;
  password: string;
}

export interface EmailCodeCredentials {
  email: string;
  code?: string;
}

export interface SmsCodeCredentials {
  phoneNumber: string;
  code?: string;
}

export interface BiometricCredentials {
  userId?: string;
  challenge?: string;
}

export interface OAuthCredentials {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  authorizationCode?: string;
  state?: string;
  nonce?: string;
}

export interface CustomCredentials {
  [key: string]: string | number | boolean | null | undefined;
}

export type SignInProviderOptions = {
  scopes?: string[];
  customParameters?: Record<string, string>;
  loginHint?: string;
  prompt?: string;
  display?: string;
  accessType?: string;
  includeGrantedScopes?: boolean;
  state?: string;
  nonce?: string;
  pkceEnabled?: boolean;
};

export interface SignOutOptions {
  provider?: AuthProvider;
  revokeToken?: boolean;
  clearCache?: boolean;
  redirectUrl?: string;
}

export interface AuthResult {
  user: AuthUser;
  credential: AuthCredential;
  additionalUserInfo?: AdditionalUserInfo;
  operationType?: 'signIn' | 'link' | 'reauthenticate';
}

export interface AuthUser {
  uid: string;
  email?: string | null;
  emailVerified?: boolean;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  isAnonymous?: boolean;
  tenantId?: string | null;
  providerData: UserInfo[];
  metadata: UserMetadata;
  refreshToken?: string;
  customClaims?: Record<string, string | number | boolean | null>;
}

export interface UserInfo {
  providerId: string;
  uid: string;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
}

export interface UserMetadata {
  creationTime?: string;
  lastSignInTime?: string;
  lastRefreshTime?: string;
}

export interface AuthCredential {
  providerId: string;
  signInMethod: string;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  rawNonce?: string;
}

export interface AdditionalUserInfo {
  isNewUser: boolean;
  providerId: string;
  profile?: Record<string, string | number | boolean | null | undefined>;
  username?: string;
}

export interface RefreshTokenOptions {
  provider?: AuthProvider;
  forceRefresh?: boolean;
}

export type AuthStateChangeCallback = (user: AuthUser | null) => void;

export interface IsSupportedOptions {
  provider: AuthProvider;
}

export interface IsSupportedResult {
  isSupported: boolean;
  reason?: string;
  availableProviders?: AuthProvider[];
}

export interface ConfigureOptions {
  provider: AuthProvider;
  options: ProviderOptions;
}

export interface LinkAccountOptions {
  provider: AuthProvider;
  credentials?: AuthCredentials;
  options?: SignInProviderOptions;
}

export interface UnlinkAccountOptions {
  provider: AuthProvider;
}

export interface PasswordResetOptions {
  email: string;
  actionCodeSettings?: ActionCodeSettings;
}

export interface ActionCodeSettings {
  url: string;
  handleCodeInApp?: boolean;
  iOSBundleId?: string;
  androidPackageName?: string;
  androidInstallApp?: boolean;
  androidMinimumVersion?: string;
  dynamicLinkDomain?: string;
}

export interface EmailVerificationOptions {
  actionCodeSettings?: ActionCodeSettings;
}

export interface SendSmsCodeOptions {
  phoneNumber: string;
  recaptchaToken?: string;
  testCode?: string;
}

export interface VerifySmsCodeOptions {
  phoneNumber: string;
  code: string;
  verificationId?: string;
}

export interface SendEmailCodeOptions {
  email: string;
  recaptchaToken?: string;
  testCode?: string;
}

export interface VerifyEmailCodeOptions {
  email: string;
  code: string;
  verificationId?: string;
}

export interface UpdateProfileOptions {
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  customClaims?: Record<string, string | number | boolean | null>;
}

export interface DeleteAccountOptions {
  requireReauthentication?: boolean;
  provider?: AuthProvider;
  credentials?: AuthCredentials;
}

export interface GetIdTokenOptions {
  forceRefresh?: boolean;
  provider?: AuthProvider;
}

export interface SetCustomParametersOptions {
  provider: AuthProvider;
  parameters: Record<string, string>;
}

export interface RevokeAccessOptions {
  provider?: AuthProvider;
  token?: string;
}

export enum AuthPersistence {
  LOCAL = 'local',
  SESSION = 'session',
  NONE = 'none',
}

export interface AuthError extends Error {
  code: string;
  details?: Record<string, unknown>;
  provider?: AuthProvider;
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'auth/invalid-credentials',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  WEAK_PASSWORD = 'auth/weak-password',
  NETWORK_ERROR = 'auth/network-error',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  USER_DISABLED = 'auth/user-disabled',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  INVALID_EMAIL = 'auth/invalid-email',
  INVALID_PHONE_NUMBER = 'auth/invalid-phone-number',
  INVALID_VERIFICATION_CODE = 'auth/invalid-verification-code',
  EXPIRED_ACTION_CODE = 'auth/expired-action-code',
  CREDENTIAL_ALREADY_IN_USE = 'auth/credential-already-in-use',
  ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL = 'auth/account-exists-with-different-credential',
  REQUIRES_RECENT_LOGIN = 'auth/requires-recent-login',
  PROVIDER_ALREADY_LINKED = 'auth/provider-already-linked',
  NO_SUCH_PROVIDER = 'auth/no-such-provider',
  INVALID_USER_TOKEN = 'auth/invalid-user-token',
  TOKEN_EXPIRED = 'auth/token-expired',
  USER_TOKEN_EXPIRED = 'auth/user-token-expired',
  INVALID_API_KEY = 'auth/invalid-api-key',
  USER_CANCELLED = 'auth/user-cancelled',
  APP_NOT_AUTHORIZED = 'auth/app-not-authorized',
  KEYCHAIN_ERROR = 'auth/keychain-error',
  INTERNAL_ERROR = 'auth/internal-error',
  BIOMETRIC_NOT_AVAILABLE = 'auth/biometric-not-available',
  BIOMETRIC_NOT_ENROLLED = 'auth/biometric-not-enrolled',
  BIOMETRIC_AUTHENTICATION_FAILED = 'auth/biometric-authentication-failed',
  UNSUPPORTED_PROVIDER = 'auth/unsupported-provider',
  MISSING_CONFIGURATION = 'auth/missing-configuration',
  POPUP_BLOCKED = 'auth/popup-blocked',
  POPUP_CLOSED_BY_USER = 'auth/popup-closed-by-user',
  REDIRECT_CANCELLED_BY_USER = 'auth/redirect-cancelled-by-user',
  MISSING_REDIRECT_URL = 'auth/missing-redirect-url',
  INVALID_STATE = 'auth/invalid-state',
  MISSING_CODE_VERIFIER = 'auth/missing-code-verifier',
  INVALID_CODE_VERIFIER = 'auth/invalid-code-verifier',
  MISSING_NONCE = 'auth/missing-nonce',
  INVALID_NONCE = 'auth/invalid-nonce',
  UNAUTHORIZED_DOMAIN = 'auth/unauthorized-domain',
  INVALID_CONTINUE_URL = 'auth/invalid-continue-url',
  MISSING_CONTINUE_URL = 'auth/missing-continue-url',
  INVALID_DYNAMIC_LINK_DOMAIN = 'auth/invalid-dynamic-link-domain',
  REJECTED_CREDENTIAL = 'auth/rejected-credential',
  PHONE_NUMBER_ALREADY_EXISTS = 'auth/phone-number-already-exists',
  QUOTA_EXCEEDED = 'auth/quota-exceeded',
  CAPTCHA_CHECK_FAILED = 'auth/captcha-check-failed',
  MISSING_CAPTCHA_TOKEN = 'auth/missing-captcha-token',
  INVALID_CAPTCHA_TOKEN = 'auth/invalid-captcha-token',
  MISSING_CLIENT_IDENTIFIER = 'auth/missing-client-identifier',
  MISSING_OR_INVALID_NONCE = 'auth/missing-or-invalid-nonce',
  INTERACTION_REQUIRED = 'auth/interaction-required',
  LOGIN_REQUIRED = 'auth/login-required',
  CONSENT_REQUIRED = 'auth/consent-required',
  INVALID_GRANT = 'auth/invalid-grant',
  UNSUPPORTED_GRANT_TYPE = 'auth/unsupported-grant-type',
  PROVIDER_INIT_FAILED = 'auth/provider-init-failed',
  SIGN_IN_FAILED = 'auth/sign-in-failed',
  SIGN_OUT_FAILED = 'auth/sign-out-failed',
  NO_AUTH_SESSION = 'auth/no-auth-session',
  TOKEN_REFRESH_FAILED = 'auth/token-refresh-failed',
  ACCESS_DENIED = 'auth/access-denied',
  SERVER_ERROR = 'auth/server-error',
  TEMPORARILY_UNAVAILABLE = 'auth/temporarily-unavailable',
  INVALID_REQUEST = 'auth/invalid-request',
  INVALID_SCOPE = 'auth/invalid-scope',
  CLIENT_NOT_FOUND = 'auth/client-not-found',
  MISSING_CONFIG = 'auth/missing-config',
  PROVIDER_NOT_INITIALIZED = 'auth/provider-not-initialized',
}
