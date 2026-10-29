package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.tasks.Task;

/**
 * The legacy {@code GoogleSignIn} flow — the API {@code @codetrix-studio/capacitor-google-auth} used —
 * kept as the automatic fallback when Credential Manager refuses a request.
 *
 * <p>Google deprecated it and play-services-auth 22.0.0 removed it, so this ships on the pinned 21.x
 * line (see {@code android/build.gradle}). The Activity result arrives through {@link ActivityLauncher},
 * that is through Capacitor's {@code @ActivityCallback}, never through an un-forwarded
 * {@code onActivityResult}.</p>
 */
final class GoogleLegacySignIn {

    private final Context context;
    private final Activity activity;
    private final AuthLogger logger;

    GoogleLegacySignIn(Context context, Activity activity, AuthLogger logger) {
        this.context = context;
        this.activity = activity;
        this.logger = logger;
    }

    /** Interactive sign-in: shows Google's account chooser. */
    void signIn(String serverClientId, String hostedDomain, String loginHint, ActivityLauncher launcher, final GoogleProfileCallback callback) {
        if (launcher == null || activity == null) {
            callback.onError(new AuthException(AuthErrorCodes.PROVIDER_NOT_INITIALIZED,
                    "Legacy Google Sign-In needs a foreground Activity and an active plugin call."));
            return;
        }
        GoogleSignInClient client = client(serverClientId, hostedDomain, loginHint);
        Intent intent = client.getSignInIntent();
        logger.info("Starting legacy Google Sign-In (account chooser)");
        boolean launched = launcher.launch(intent, (resultCode, data) ->
                handleTask(GoogleSignIn.getSignedInAccountFromIntent(data), callback));
        if (!launched) {
            callback.onError(new AuthException(AuthErrorCodes.INTERNAL_ERROR,
                    "Legacy Google Sign-In could not start: no plugin call is in flight."));
        }
    }

    /** Silent sign-in for a returning user; never shows UI. */
    void silentSignIn(String serverClientId, final GoogleProfileCallback callback) {
        try {
            client(serverClientId, null, null).silentSignIn()
                    .addOnCompleteListener(task -> handleTask(task, callback));
        } catch (Exception e) {
            callback.onError(new AuthException(AuthErrorCodes.NO_AUTH_SESSION,
                    "Legacy silent Google Sign-In failed: " + e.getMessage(), e));
        }
    }

    /** Clears the legacy cached account so the next interactive sign-in shows the chooser. */
    void signOut() {
        try {
            GoogleSignIn.getClient(context, new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).build()).signOut();
        } catch (Exception e) {
            logger.warn("Legacy Google sign-out failed: " + e.getMessage());
        }
    }

    private GoogleSignInClient client(String serverClientId, String hostedDomain, String loginHint) {
        GoogleSignInOptions.Builder builder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(serverClientId)
                .requestEmail()
                .requestProfile();
        if (hostedDomain != null && !hostedDomain.isEmpty()) {
            builder.setHostedDomain(hostedDomain);
        }
        if (loginHint != null && !loginHint.isEmpty()) {
            builder.setAccountName(loginHint);
        }
        return activity != null
                ? GoogleSignIn.getClient(activity, builder.build())
                : GoogleSignIn.getClient(context, builder.build());
    }

    private void handleTask(Task<GoogleSignInAccount> task, GoogleProfileCallback callback) {
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            if (account == null || account.getIdToken() == null || account.getIdToken().isEmpty()) {
                callback.onError(new AuthException(AuthErrorCodes.SIGN_IN_FAILED,
                        "Legacy Google Sign-In returned no ID token. Check that serverClientId is the WEB "
                                + "OAuth client id (" + SigningDiagnostics.describe(context) + ")."));
                return;
            }
            String photo = account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null;
            logger.info("Legacy Google Sign-In successful");
            callback.onSuccess(new GoogleResultMapper.Profile(account.getIdToken(), account.getEmail(),
                    account.getDisplayName(), photo, account.getId(), account.getServerAuthCode()));
        } catch (ApiException e) {
            callback.onError(mapApiException(e));
        } catch (Exception e) {
            callback.onError(new AuthException(AuthErrorCodes.SIGN_IN_FAILED,
                    "Legacy Google Sign-In failed: " + e.getMessage(), e));
        }
    }

    private AuthException mapApiException(ApiException e) {
        int status = e.getStatusCode();
        String detail = "Legacy Google Sign-In status " + status + " ("
                + GoogleSignInStatusCodes.getStatusCodeString(status) + ")";
        if (status == GoogleSignInStatusCodes.SIGN_IN_CANCELLED) {
            return new AuthException(AuthErrorCodes.USER_CANCELLED, "User cancelled Google sign-in", e);
        }
        if (status == CommonStatusCodes.NETWORK_ERROR) {
            return new AuthException(AuthErrorCodes.NETWORK_ERROR, detail + ". Check the connection and try again.", e);
        }
        if (status == CommonStatusCodes.DEVELOPER_ERROR) {
            return new AuthException(AuthErrorCodes.MISSING_CONFIGURATION, detail
                    + ": Google has no Android OAuth client for this app's package + signing certificate in the "
                    + "same Google Cloud project as serverClientId. Register this SHA-1 (" + SigningDiagnostics.describe(context)
                    + "). A Play-installed build is signed with the Play App Signing key.", e);
        }
        if (status == CommonStatusCodes.SIGN_IN_REQUIRED) {
            return new AuthException(AuthErrorCodes.NO_AUTH_SESSION, detail, e);
        }
        return new AuthException(AuthErrorCodes.SIGN_IN_FAILED, detail + ": " + e.getMessage(), e);
    }
}
