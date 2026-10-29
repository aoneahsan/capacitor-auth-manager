package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;

import com.getcapacitor.JSObject;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Android native Google sign-in: legacy <b>GoogleSignIn</b> first, <b>Credential Manager</b> as the fallback.
 *
 * <p>{@code androidFlow: 'auto'} (the default) runs {@link GoogleLegacySignIn} — the exact path
 * {@code @codetrix-studio/capacitor-google-auth} ran — and falls back to {@link GoogleCredentialManagerSignIn}
 * (bottom sheet, then the "Sign in with Google" button) when GoogleSignIn fails for any reason other than
 * the user cancelling. 3.0.0 ran Credential Manager alone, and Play-installed builds of every production
 * app were refused before any account picker appeared, while the same OAuth clients and SHA-1s had worked
 * through GoogleSignIn in the previous release (2026-10-29). On Android 14+ Credential Manager goes
 * through the system credential service, which can fail with no UI when Google is not an enabled
 * credential provider on the device; GoogleSignIn never touches that service. {@code 'legacy'},
 * {@code 'credential-manager'}, {@code 'bottom-sheet'} and {@code 'button'} pin one path.</p>
 *
 * <p>Every error keeps Google's own exception class and message, and configuration errors name the
 * installed package + signing SHA-1 ({@link SigningDiagnostics}), so the cause is readable on the device.</p>
 *
 * <p>The package is Firebase-agnostic: it returns {@code { idToken, ... }} and the app signs in with it.
 * Neither path returns an OAuth access token; extra scopes, server-side revoke and refresh tokens are out
 * of scope for this provider.</p>
 */
public class GoogleAuthProvider implements BaseAuthProvider {
    private static final String STORAGE_CREDENTIAL_KEY = "google";
    private static final String STORAGE_USER_KEY = "google_user";

    private final AuthStorage storage;
    private final AuthLogger logger;
    private final GoogleLegacySignIn legacy;
    private final GoogleCredentialManagerSignIn credentialManager;
    private ActivityLauncher activityLauncher;

    private String clientId;
    private String serverClientId;
    // Retained for API parity: neither Android path requests extra OAuth scopes.
    private List<String> scopes;
    private boolean filterByAuthorizedAccounts = false;
    private boolean autoSelectEnabled = false;
    private String nonce;
    private String hostedDomain;
    private String loginHint;
    /** "auto" | "legacy" | "credential-manager" | "bottom-sheet" | "button". */
    private String androidFlow = "auto";

    private JSObject currentUser;

    public GoogleAuthProvider(Context context, Activity activity, AuthStorage storage, AuthLogger logger) {
        this.storage = storage;
        this.logger = logger;
        this.legacy = new GoogleLegacySignIn(context, activity, logger);
        this.credentialManager = new GoogleCredentialManagerSignIn(context, activity, logger);
        this.scopes = new ArrayList<>();
        this.scopes.add("email");
        this.scopes.add("profile");
    }

    // ---- Configuration (populated by ProviderFactory from the google provider options) ----

    public void setActivityLauncher(ActivityLauncher activityLauncher) {
        this.activityLauncher = activityLauncher;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public void setServerClientId(String serverClientId) {
        this.serverClientId = serverClientId;
    }

    public void setScopes(List<String> scopes) {
        if (scopes != null && !scopes.isEmpty()) {
            this.scopes = scopes;
        }
    }

    public void setFilterByAuthorizedAccounts(boolean filterByAuthorizedAccounts) {
        this.filterByAuthorizedAccounts = filterByAuthorizedAccounts;
    }

    public void setAutoSelectEnabled(boolean autoSelectEnabled) {
        this.autoSelectEnabled = autoSelectEnabled;
    }

    public void setNonce(String nonce) {
        this.nonce = nonce;
    }

    public void setHostedDomain(String hostedDomain) {
        this.hostedDomain = hostedDomain;
    }

    public void setLoginHint(String loginHint) {
        this.loginHint = loginHint;
    }

    public void setAndroidFlow(String androidFlow) {
        if (androidFlow != null && !androidFlow.isEmpty()) {
            this.androidFlow = androidFlow;
        }
    }

    // ---- BaseAuthProvider ----

    @Override
    public void initialize(CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Initializing Google auth provider (GoogleSignIn + Credential Manager fallback)");
        try {
            JSObject storedUser = storage.getUser(STORAGE_USER_KEY);
            if (storedUser != null) {
                currentUser = storedUser;
                logger.info("Restored previous Google session from storage");
            }
            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
        } catch (Exception e) {
            logger.error("Failed to initialize Google auth provider", e);
            callback.onResult(CapacitorAuthManager.AuthResult.error(new AuthException(
                    AuthErrorCodes.PROVIDER_INIT_FAILED,
                    "Failed to initialize Google auth provider: " + e.getMessage(), e)));
        }
    }

    @Override
    public void signIn(JSObject credentials, JSObject options, final CapacitorAuthManager.AuthCallback<JSObject> callback) {
        String flow = androidFlow;
        if (options != null && options.has("androidFlow")) {
            String perCall = options.getString("androidFlow");
            if (perCall != null && !perCall.isEmpty()) {
                flow = perCall;
            }
        }
        logger.info("Starting Google sign-in (flow=" + flow + ")");
        if (resolvedServerClientId() == null) {
            callback.onResult(missingClientId());
            return;
        }
        warnIfUnsupportedOptions();
        switch (flow) {
            case "legacy":
                runLegacy(profileCallback(callback));
                return;
            case "credential-manager":
                runCredentialManager(profileCallback(callback));
                return;
            case "bottom-sheet":
                credentialManager.requestBottomSheet(resolvedServerClientId(), nonce, filterByAuthorizedAccounts,
                        autoSelectEnabled, profileCallback(callback));
                return;
            case "button":
                credentialManager.requestButton(resolvedServerClientId(), nonce, hostedDomain, profileCallback(callback));
                return;
            default:
                runAuto(profileCallback(callback));
        }
    }

    /** GoogleSignIn first; Credential Manager when it fails for any reason other than a cancel. */
    private void runAuto(final GoogleProfileCallback callback) {
        runLegacy(new GoogleProfileCallback() {
            @Override
            public void onSuccess(GoogleResultMapper.Profile profile) {
                callback.onSuccess(profile);
            }

            @Override
            public void onError(final AuthException legacyError) {
                if (isCancellation(legacyError)) {
                    callback.onError(legacyError);
                    return;
                }
                logger.warn("Legacy GoogleSignIn failed; trying Credential Manager: " + legacyError.getMessage());
                runCredentialManager(new GoogleProfileCallback() {
                    @Override
                    public void onSuccess(GoogleResultMapper.Profile profile) {
                        callback.onSuccess(profile);
                    }

                    @Override
                    public void onError(AuthException cmError) {
                        if (isCancellation(cmError)) {
                            callback.onError(cmError);
                            return;
                        }
                        logger.error("Google sign-in failed on both paths", cmError);
                        callback.onError(new AuthException(legacyError.getCode(), legacyError.getMessage()
                                + " | Credential Manager: " + cmError.getMessage(), legacyError));
                    }
                });
            }
        });
    }

    private void runLegacy(GoogleProfileCallback callback) {
        legacy.signIn(resolvedServerClientId(), hostedDomain, loginHint, activityLauncher, callback);
    }

    /** Credential Manager: bottom sheet, then the button flow when no account is offered. */
    private void runCredentialManager(final GoogleProfileCallback callback) {
        credentialManager.requestBottomSheet(resolvedServerClientId(), nonce, filterByAuthorizedAccounts, autoSelectEnabled,
                new GoogleProfileCallback() {
                    @Override
                    public void onSuccess(GoogleResultMapper.Profile profile) {
                        callback.onSuccess(profile);
                    }

                    @Override
                    public void onError(AuthException error) {
                        if (!(error instanceof GoogleCredentialManagerSignIn.NoGoogleCredentialException)) {
                            callback.onError(error);
                            return;
                        }
                        logger.info("No Google credential from the bottom sheet; trying the Sign in with Google button flow");
                        credentialManager.requestButton(resolvedServerClientId(), nonce, hostedDomain, callback);
                    }
                });
    }

    private static boolean isCancellation(AuthException error) {
        return AuthErrorCodes.USER_CANCELLED.equals(error.getCode());
    }

    /** Adapts a path's profile result to the bridge result, persisting the session on success. */
    private GoogleProfileCallback profileCallback(final CapacitorAuthManager.AuthCallback<JSObject> callback) {
        return new GoogleProfileCallback() {
            @Override
            public void onSuccess(GoogleResultMapper.Profile profile) {
                callback.onResult(CapacitorAuthManager.AuthResult.success(completeSignIn(profile)));
            }

            @Override
            public void onError(AuthException error) {
                callback.onResult(CapacitorAuthManager.AuthResult.error(error));
            }
        };
    }

    @Override
    public void signOut(JSObject options, CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Signing out from Google (GoogleSignIn + Credential Manager state)");
        clearCredentialState(callback);
    }

    @Override
    public void getCurrentUser(CapacitorAuthManager.AuthCallback<JSObject> callback) {
        if (currentUser == null) {
            currentUser = storage.getUser(STORAGE_USER_KEY);
        }
        callback.onResult(CapacitorAuthManager.AuthResult.success(currentUser));
    }

    @Override
    public void refreshToken(JSObject options, final CapacitorAuthManager.AuthCallback<JSObject> callback) {
        logger.info("Refreshing Google ID token (silent attempt)");
        silentSignIn(result -> {
            if (result.isSuccess()) {
                callback.onResult(result);
            } else {
                callback.onResult(CapacitorAuthManager.AuthResult.error(new AuthException(
                        AuthErrorCodes.TOKEN_REFRESH_FAILED,
                        "Re-authentication required: could not silently refresh the Google ID token. "
                                + "Prompt the user to sign in again.")));
            }
        });
    }

    @Override
    public void isSupported(CapacitorAuthManager.AuthCallback<Boolean> callback) {
        callback.onResult(CapacitorAuthManager.AuthResult.success(true));
    }

    @Override
    public void linkAccount(JSObject credentials, JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        signIn(credentials, options, callback);
    }

    @Override
    public void unlinkAccount(CapacitorAuthManager.AuthCallback<Void> callback) {
        revokeAccess(null, callback);
    }

    @Override
    public void getIdToken(boolean forceRefresh, final CapacitorAuthManager.AuthCallback<JSObject> callback) {
        if (!forceRefresh) {
            JSObject storedCredential = storage.getCredential(STORAGE_CREDENTIAL_KEY);
            String idToken = storedCredential != null ? storedCredential.getString("idToken") : null;
            if (idToken != null && !idToken.isEmpty() && isFreshIdToken(idToken)) {
                JSObject result = new JSObject();
                result.put("token", idToken);
                callback.onResult(CapacitorAuthManager.AuthResult.success(result));
                return;
            }
        }
        silentSignIn(result -> {
            if (result.isSuccess() && result.getData() != null) {
                JSObject credential = result.getData().getJSObject("credential");
                String idToken = credential != null ? credential.getString("idToken") : null;
                if (idToken != null && !idToken.isEmpty()) {
                    JSObject out = new JSObject();
                    out.put("token", idToken);
                    callback.onResult(CapacitorAuthManager.AuthResult.success(out));
                    return;
                }
            }
            callback.onResult(CapacitorAuthManager.AuthResult.error(new AuthException(
                    AuthErrorCodes.NO_AUTH_SESSION,
                    "No Google ID token available. Re-authentication required.")));
        });
    }

    /** Silent GoogleSignIn, then a silent Credential Manager attempt. Never shows UI. */
    private void silentSignIn(final CapacitorAuthManager.AuthCallback<JSObject> callback) {
        if (resolvedServerClientId() == null) {
            callback.onResult(missingClientId());
            return;
        }
        final GoogleProfileCallback done = profileCallback(callback);
        legacy.silentSignIn(resolvedServerClientId(), new GoogleProfileCallback() {
            @Override
            public void onSuccess(GoogleResultMapper.Profile profile) {
                done.onSuccess(profile);
            }

            @Override
            public void onError(AuthException error) {
                credentialManager.requestBottomSheet(resolvedServerClientId(), nonce, true, true, done);
            }
        });
    }

    private boolean isFreshIdToken(String idToken) {
        JSONObject claims = GoogleResultMapper.parseIdTokenClaims(idToken, logger);
        return claims != null && claims.optLong("exp", 0) > System.currentTimeMillis() / 1000;
    }

    @Override
    public void revokeAccess(String token, CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Revoking Google access (clears local, GoogleSignIn and Credential Manager state; no server-side revoke)");
        clearCredentialState(callback);
    }

    // ---- Helpers ----

    private String resolvedServerClientId() {
        if (serverClientId != null && !serverClientId.isEmpty()) {
            return serverClientId;
        }
        return clientId != null && !clientId.isEmpty() ? clientId : null;
    }

    private static CapacitorAuthManager.AuthResult<JSObject> missingClientId() {
        return CapacitorAuthManager.AuthResult.error(new AuthException(
                AuthErrorCodes.MISSING_CONFIGURATION,
                "Google sign-in requires a serverClientId (your Web OAuth client id). "
                        + "Provide 'serverClientId' (or 'clientId') in the google provider options."));
    }

    private void clearCredentialState(final CapacitorAuthManager.AuthCallback<Void> callback) {
        legacy.signOut();
        credentialManager.clearState(() -> {
            clearSession();
            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
        });
    }

    /** Builds the shared result shape, keeps the user in memory and persists the session. */
    private JSObject completeSignIn(GoogleResultMapper.Profile profile) {
        JSObject result = GoogleResultMapper.buildResult(profile, logger);
        currentUser = result.getJSObject("user");
        try {
            storage.saveCredential(STORAGE_CREDENTIAL_KEY, result.getJSObject("credential"));
            storage.saveUser(STORAGE_USER_KEY, currentUser);
        } catch (Exception e) {
            logger.warn("Failed to persist Google session");
        }
        return result;
    }

    private void clearSession() {
        currentUser = null;
        storage.deleteCredential(STORAGE_CREDENTIAL_KEY);
        storage.deleteUser(STORAGE_USER_KEY);
    }

    private void warnIfUnsupportedOptions() {
        for (String scope : scopes) {
            if (scope != null && !scope.equals("email") && !scope.equals("profile") && !scope.equals("openid")) {
                logger.warn("Additional OAuth scopes are ignored by Android Google sign-in (ID token only).");
                break;
            }
        }
    }
}
