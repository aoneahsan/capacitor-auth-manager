package com.aoneahsan.capacitor_auth_manager;

/**
 * The subset of {@code AuthErrorCode} (see {@code src/definitions.ts}) that the Android layer can
 * raise. The string values MUST stay identical to the TypeScript enum: they travel to JS as the
 * Capacitor error code, and {@code AuthError.fromError} promotes a recognised value straight into
 * {@code AuthError.code}. An unrecognised string silently degrades to {@code INTERNAL_ERROR}, so
 * never invent a code here that the enum does not define.
 */
public final class AuthErrorCodes {

    public static final String USER_CANCELLED = "auth/user-cancelled";
    public static final String SIGN_IN_FAILED = "auth/sign-in-failed";
    public static final String SIGN_OUT_FAILED = "auth/sign-out-failed";
    public static final String NETWORK_ERROR = "auth/network-error";
    public static final String INVALID_CREDENTIALS = "auth/invalid-credentials";
    public static final String INTERNAL_ERROR = "auth/internal-error";
    public static final String PROVIDER_NOT_INITIALIZED = "auth/provider-not-initialized";
    public static final String PROVIDER_NOT_ENABLED = "auth/provider-not-enabled";
    public static final String PROVIDER_INIT_FAILED = "auth/provider-init-failed";
    public static final String MISSING_CONFIGURATION = "auth/missing-configuration";
    public static final String CREDENTIALS_REQUIRED = "auth/credentials-required";
    public static final String EMAIL_REQUIRED = "auth/email-required";
    public static final String PHONE_REQUIRED = "auth/phone-required";
    public static final String NO_AUTH_SESSION = "auth/no-auth-session";
    public static final String TOKEN_REFRESH_FAILED = "auth/token-refresh-failed";
    public static final String OPERATION_NOT_ALLOWED = "auth/operation-not-allowed";
    public static final String UNSUPPORTED_PROVIDER = "auth/unsupported-provider";

    private AuthErrorCodes() {
    }
}
