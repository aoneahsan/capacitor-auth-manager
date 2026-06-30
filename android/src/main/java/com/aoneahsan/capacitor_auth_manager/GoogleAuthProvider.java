package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.ContextCompat;

import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

import com.getcapacitor.JSObject;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.Executor;

/**
 * Android native Google sign-in built on the modern <b>Credential Manager</b> API
 * ({@code androidx.credentials}) + the Google Identity {@code GetGoogleIdOption}.
 *
 * <p>This replaces the deprecated {@code com.google.android.gms.auth.api.signin.GoogleSignIn} +
 * {@code startActivityForResult(...)} flow, which relied on an {@code onActivityResult} callback the
 * plugin never forwarded (so interactive sign-in hung forever). Credential Manager uses an async
 * callback ({@link CredentialManagerCallback}) — no {@code onActivityResult} — so that bug class is gone.</p>
 *
 * <p>The package is Firebase-agnostic: this provider returns a credential
 * {@code { idToken, ... }} to JS and the app performs its own Firebase
 * {@code signInWithCredential(GoogleAuthProvider.credential(idToken))} (or anything else) later.</p>
 *
 * <p><b>Limitations of Credential Manager Google sign-in (intentional):</b></p>
 * <ul>
 *   <li>Only an <b>idToken</b> is returned. There is no OAuth access token and no serverAuthCode,
 *       so {@code credential.accessToken} / {@code credential.serverAuthCode} are intentionally absent.
 *       Use the Google Authorization API if you need an access token / extra scopes.</li>
 *   <li>{@code GetGoogleIdOption} does not request additional OAuth scopes, nor honor
 *       {@code hostedDomain} / {@code loginHint}. Those config values are accepted for API parity but
 *       are not enforced here.</li>
 *   <li>There is no server-side revoke; {@code revokeAccess} clears local + Credential Manager state only.</li>
 * </ul>
 */
public class GoogleAuthProvider implements BaseAuthProvider {
    private static final String TAG = "GoogleAuthProvider";
    private static final String PROVIDER_ID = "google.com";
    private static final String STORAGE_CREDENTIAL_KEY = "google";
    private static final String STORAGE_USER_KEY = "google_user";

    private final Context context;
    private final Activity activity;
    private final AuthStorage storage;
    private final AuthLogger logger;

    private String clientId;
    private String serverClientId;
    // Retained for API parity. Credential Manager's GetGoogleIdOption only returns an ID token and
    // cannot request additional OAuth scopes, so non-default scopes are surfaced as a warning only.
    private List<String> scopes;
    private boolean filterByAuthorizedAccounts = false;
    private boolean autoSelectEnabled = false;
    private String nonce;
    private String hostedDomain;
    private String loginHint;

    private JSObject currentUser;

    public GoogleAuthProvider(Context context, Activity activity, AuthStorage storage, AuthLogger logger) {
        this.context = context;
        this.activity = activity;
        this.storage = storage;
        this.logger = logger;
        this.scopes = new ArrayList<>();
        this.scopes.add("email");
        this.scopes.add("profile");
    }

    // ---- Configuration (populated by ProviderFactory from the google provider options) ----

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

    // ---- BaseAuthProvider ----

    @Override
    public void initialize(CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Initializing Google auth provider (Credential Manager)");
        try {
            // Credential Manager has no "last signed-in account" concept, so restore any persisted
            // user from secure storage to keep getCurrentUser() working after a cold start.
            JSObject storedUser = storage.getCredential(STORAGE_USER_KEY);
            if (storedUser != null) {
                currentUser = storedUser;
                logger.info("Restored previous Google session from storage");
            }
            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
        } catch (Exception e) {
            logger.error("Failed to initialize Google auth provider", e);
            callback.onResult(CapacitorAuthManager.AuthResult.error(e));
        }
    }

    @Override
    public void signIn(JSObject credentials, JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        logger.info("Starting Google sign-in (Credential Manager)");
        requestGoogleCredential(filterByAuthorizedAccounts, autoSelectEnabled, callback);
    }

    @Override
    public void signOut(JSObject options, CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Signing out from Google (clearing Credential Manager state)");
        clearCredentialState(callback);
    }

    @Override
    public void getCurrentUser(CapacitorAuthManager.AuthCallback<JSObject> callback) {
        if (currentUser == null) {
            currentUser = storage.getCredential(STORAGE_USER_KEY);
        }
        callback.onResult(CapacitorAuthManager.AuthResult.success(currentUser));
    }

    @Override
    public void refreshToken(JSObject options, final CapacitorAuthManager.AuthCallback<JSObject> callback) {
        logger.info("Refreshing Google ID token (silent Credential Manager attempt)");
        // A silent attempt only succeeds when exactly one previously-authorized account exists.
        requestGoogleCredential(true, true, new CapacitorAuthManager.AuthCallback<JSObject>() {
            @Override
            public void onResult(CapacitorAuthManager.AuthResult<JSObject> result) {
                if (result.isSuccess()) {
                    callback.onResult(result);
                } else {
                    callback.onResult(CapacitorAuthManager.AuthResult.error(new Exception(
                            "Re-authentication required: could not silently refresh the Google ID token. "
                                    + "Prompt the user to sign in again.")));
                }
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
            if (storedCredential != null) {
                String idToken = storedCredential.getString("idToken");
                if (idToken != null && !idToken.isEmpty()) {
                    JSObject result = new JSObject();
                    result.put("token", idToken);
                    callback.onResult(CapacitorAuthManager.AuthResult.success(result));
                    return;
                }
            }
        }

        // No cached token (or forced refresh) → silent Credential Manager attempt.
        requestGoogleCredential(true, true, new CapacitorAuthManager.AuthCallback<JSObject>() {
            @Override
            public void onResult(CapacitorAuthManager.AuthResult<JSObject> result) {
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
                callback.onResult(CapacitorAuthManager.AuthResult.error(new Exception(
                        "No Google ID token available. Re-authentication required.")));
            }
        });
    }

    @Override
    public void revokeAccess(String token, CapacitorAuthManager.AuthCallback<Void> callback) {
        // Credential Manager has no server-side revoke. Clear the locally-selected account state +
        // the persisted session so the next sign-in re-prompts.
        logger.info("Revoking Google access (clears local + Credential Manager state only; no server-side revoke)");
        clearCredentialState(callback);
    }

    // ---- Credential Manager flow ----

    private void requestGoogleCredential(
            boolean filterByAuthorized,
            boolean autoSelect,
            final CapacitorAuthManager.AuthCallback<JSObject> callback
    ) {
        String resolvedServerClientId = (serverClientId != null && !serverClientId.isEmpty())
                ? serverClientId
                : clientId;

        if (resolvedServerClientId == null || resolvedServerClientId.isEmpty()) {
            callback.onResult(CapacitorAuthManager.AuthResult.error(new IllegalStateException(
                    "Google sign-in requires a serverClientId (your Web OAuth client id). "
                            + "Provide 'serverClientId' (or 'clientId') in the google provider options.")));
            return;
        }

        if (activity == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.error(new IllegalStateException(
                    "Google sign-in requires a foreground Activity.")));
            return;
        }

        warnIfUnsupportedOptions();

        try {
            GetGoogleIdOption.Builder optionBuilder = new GetGoogleIdOption.Builder()
                    .setServerClientId(resolvedServerClientId)
                    .setFilterByAuthorizedAccounts(filterByAuthorized)
                    .setAutoSelectEnabled(autoSelect);

            if (nonce != null && !nonce.isEmpty()) {
                optionBuilder.setNonce(nonce);
            }

            GetGoogleIdOption googleIdOption = optionBuilder.build();

            GetCredentialRequest request = new GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build();

            CredentialManager credentialManager = CredentialManager.create(context);
            Executor executor = ContextCompat.getMainExecutor(context);

            credentialManager.getCredentialAsync(
                    activity,
                    request,
                    null,
                    executor,
                    new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                        @Override
                        public void onResult(GetCredentialResponse response) {
                            handleSignInResponse(response, callback);
                        }

                        @Override
                        public void onError(GetCredentialException e) {
                            handleSignInError(e, callback);
                        }
                    }
            );
        } catch (Exception e) {
            logger.error("Failed to start Google Credential Manager request", e);
            callback.onResult(CapacitorAuthManager.AuthResult.error(e));
        }
    }

    private void handleSignInResponse(
            GetCredentialResponse response,
            CapacitorAuthManager.AuthCallback<JSObject> callback
    ) {
        try {
            Credential credential = response.getCredential();
            if (credential instanceof CustomCredential
                    && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {

                GoogleIdTokenCredential googleCredential =
                        GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());

                JSONObject claims = parseIdTokenClaims(googleCredential.getIdToken());

                JSObject user = createUserObject(googleCredential, claims);
                JSObject credentialObj = createCredentialObject(googleCredential);

                currentUser = user;
                persistSession(user, credentialObj);

                JSObject result = new JSObject();
                result.put("user", user);
                result.put("credential", credentialObj);

                JSObject additionalUserInfo = new JSObject();
                additionalUserInfo.put("isNewUser", false);
                additionalUserInfo.put("providerId", PROVIDER_ID);
                if (googleCredential.getId() != null) {
                    additionalUserInfo.put("username", googleCredential.getId());
                }
                result.put("additionalUserInfo", additionalUserInfo);
                result.put("operationType", "signIn");

                logger.info("Google sign-in successful (Credential Manager)");
                callback.onResult(CapacitorAuthManager.AuthResult.success(result));
            } else {
                String type = credential != null ? credential.getType() : "null";
                logger.error("Unexpected credential type from Credential Manager: " + type, null);
                callback.onResult(CapacitorAuthManager.AuthResult.error(new IllegalStateException(
                        "Unexpected credential type returned from Google sign-in: " + type)));
            }
        } catch (Exception e) {
            // Covers a malformed credential / ID-token parse failure. (googleid 1.1.1's
            // GoogleIdTokenCredential.createFrom does not declare a checked exception.)
            logger.error("Unexpected error handling Google credential", e);
            callback.onResult(CapacitorAuthManager.AuthResult.error(e));
        }
    }

    private void handleSignInError(
            GetCredentialException e,
            CapacitorAuthManager.AuthCallback<JSObject> callback
    ) {
        if (e instanceof GetCredentialCancellationException) {
            logger.info("Google sign-in cancelled by user");
            callback.onResult(CapacitorAuthManager.AuthResult.error(new Exception("User cancelled Google sign-in")));
            return;
        }
        if (e instanceof NoCredentialException) {
            logger.warn("No Google credentials available for sign-in");
            callback.onResult(CapacitorAuthManager.AuthResult.error(new Exception(
                    "No Google account available. Add a Google account to the device, or ensure "
                            + "Google Play services is up to date and the SHA-1 fingerprint is registered.")));
            return;
        }
        logger.error("Google sign-in failed: " + e.getClass().getSimpleName(), e);
        callback.onResult(CapacitorAuthManager.AuthResult.error(new Exception(
                "Google sign-in failed: " + e.getMessage())));
    }

    private void clearCredentialState(final CapacitorAuthManager.AuthCallback<Void> callback) {
        try {
            CredentialManager credentialManager = CredentialManager.create(context);
            Executor executor = ContextCompat.getMainExecutor(context);
            credentialManager.clearCredentialStateAsync(
                    new ClearCredentialStateRequest(),
                    null,
                    executor,
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        @Override
                        public void onResult(Void unused) {
                            clearSession();
                            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
                        }

                        @Override
                        public void onError(ClearCredentialException e) {
                            logger.error("Failed to clear Credential Manager state", e);
                            // Still clear local session so the app reflects a signed-out state.
                            clearSession();
                            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
                        }
                    }
            );
        } catch (Exception e) {
            logger.error("Error clearing Credential Manager state", e);
            clearSession();
            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
        }
    }

    // ---- Result building ----

    private JSObject createUserObject(GoogleIdTokenCredential cred, JSONObject claims) {
        String email = cred.getId();
        String displayName = cred.getDisplayName();
        Uri photoUri = cred.getProfilePictureUri();
        String photoURL = photoUri != null ? photoUri.toString() : null;
        String phoneNumber = cred.getPhoneNumber();

        String uid = null;
        boolean emailVerified = true;
        if (claims != null) {
            String sub = claims.optString("sub", null);
            if (sub != null && !sub.isEmpty()) {
                uid = sub;
            }
            if (claims.has("email_verified")) {
                emailVerified = claims.optBoolean("email_verified", true);
            }
            if (email == null) {
                email = claims.optString("email", null);
            }
            if (displayName == null) {
                displayName = claims.optString("name", null);
            }
            if (photoURL == null) {
                String picture = claims.optString("picture", null);
                if (picture != null && !picture.isEmpty()) {
                    photoURL = picture;
                }
            }
        }
        if (uid == null || uid.isEmpty()) {
            // Credential Manager doesn't expose the Google `sub` directly; fall back to the email id.
            uid = email;
        }

        JSObject user = new JSObject();
        user.put("uid", uid);
        user.put("email", email);
        user.put("emailVerified", emailVerified);
        user.put("displayName", displayName);
        user.put("photoURL", photoURL);
        user.put("phoneNumber", phoneNumber);
        user.put("isAnonymous", false);
        // tenantId / refreshToken intentionally omitted (not available from Credential Manager).

        JSONArray providerData = new JSONArray();
        JSObject providerEntry = new JSObject();
        providerEntry.put("providerId", PROVIDER_ID);
        providerEntry.put("uid", uid);
        providerEntry.put("displayName", displayName);
        providerEntry.put("email", email);
        providerEntry.put("phoneNumber", phoneNumber);
        providerEntry.put("photoURL", photoURL);
        providerData.put(providerEntry);
        user.put("providerData", providerData);

        JSObject metadata = new JSObject();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        metadata.put("lastSignInTime", sdf.format(new Date()));
        user.put("metadata", metadata);

        return user;
    }

    private JSObject createCredentialObject(GoogleIdTokenCredential cred) {
        JSObject credential = new JSObject();
        credential.put("providerId", PROVIDER_ID);
        credential.put("signInMethod", PROVIDER_ID);
        credential.put("idToken", cred.getIdToken());
        // accessToken and serverAuthCode are NOT provided by Credential Manager sign-in (ID token only) —
        // intentionally absent. Consumers feed credential.idToken into their own signInWithCredential(...).
        return credential;
    }

    // ---- Helpers ----

    private void persistSession(JSObject user, JSObject credential) {
        try {
            storage.saveCredential(STORAGE_CREDENTIAL_KEY, credential);
            storage.saveCredential(STORAGE_USER_KEY, user);
        } catch (Exception e) {
            logger.warn("Failed to persist Google session");
        }
    }

    private void clearSession() {
        currentUser = null;
        storage.deleteCredential(STORAGE_CREDENTIAL_KEY);
        storage.deleteCredential(STORAGE_USER_KEY);
    }

    private void warnIfUnsupportedOptions() {
        if (hostedDomain != null || loginHint != null) {
            logger.warn("hostedDomain/loginHint are not enforced by Android Credential Manager "
                    + "(GetGoogleIdOption) and will be ignored");
        }
        if (scopes != null && !scopes.isEmpty()) {
            for (String scope : scopes) {
                if (scope != null
                        && !scope.equals("email")
                        && !scope.equals("profile")
                        && !scope.equals("openid")) {
                    logger.warn("Additional OAuth scopes are ignored by Android Credential Manager Google "
                            + "sign-in (ID token only). Use the Google Authorization API for extra scopes.");
                    break;
                }
            }
        }
    }

    /**
     * Best-effort decode of the (unverified) ID-token JWT payload to read claims such as {@code sub}
     * and {@code email_verified}. The token's signature is verified server-side by the consumer's
     * own {@code signInWithCredential}; this is only used to enrich the user object.
     */
    private JSONObject parseIdTokenClaims(String idToken) {
        if (idToken == null || idToken.isEmpty()) {
            return null;
        }
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                return null;
            }
            byte[] decoded = Base64.decode(parts[1], Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
            return new JSONObject(new String(decoded, StandardCharsets.UTF_8));
        } catch (Exception e) {
            logger.warn("Failed to parse Google ID token claims");
            return null;
        }
    }
}
