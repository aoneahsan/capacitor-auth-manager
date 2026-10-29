package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;
import android.net.Uri;

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
import androidx.credentials.exceptions.GetCredentialInterruptedException;
import androidx.credentials.exceptions.NoCredentialException;

import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

/**
 * The Android Credential Manager Google path ({@code androidx.credentials} + Google Identity): the
 * bottom sheet ({@link GetGoogleIdOption}) and the "Sign in with Google" button
 * ({@link GetSignInWithGoogleOption}). Every failure keeps Google's own exception class and message.
 */
final class GoogleCredentialManagerSignIn {

    /** Raised when the bottom sheet offers no account, so the caller can try the button flow. */
    static final class NoGoogleCredentialException extends AuthException {
        NoGoogleCredentialException(String message, Throwable cause) {
            super(AuthErrorCodes.SIGN_IN_FAILED, message, cause);
        }
    }

    private final Context context;
    private final Activity activity;
    private final AuthLogger logger;

    GoogleCredentialManagerSignIn(Context context, Activity activity, AuthLogger logger) {
        this.context = context;
        this.activity = activity;
        this.logger = logger;
    }

    void requestBottomSheet(String serverClientId, String nonce, boolean filterByAuthorized, boolean autoSelect,
                            GoogleProfileCallback callback) {
        try {
            GetGoogleIdOption.Builder option = new GetGoogleIdOption.Builder()
                    .setServerClientId(serverClientId)
                    .setFilterByAuthorizedAccounts(filterByAuthorized)
                    .setAutoSelectEnabled(autoSelect);
            if (nonce != null && !nonce.isEmpty()) {
                option.setNonce(nonce);
            }
            launch(new GetCredentialRequest.Builder().addCredentialOption(option.build()).build(), callback);
        } catch (Exception e) {
            logger.error("Failed to start Google Credential Manager request", e);
            callback.onError(new AuthException(AuthErrorCodes.SIGN_IN_FAILED,
                    "Failed to start Google sign-in: " + describe(e), e));
        }
    }

    void requestButton(String serverClientId, String nonce, String hostedDomain, GoogleProfileCallback callback) {
        try {
            GetSignInWithGoogleOption.Builder option = new GetSignInWithGoogleOption.Builder(serverClientId);
            if (nonce != null && !nonce.isEmpty()) {
                option.setNonce(nonce);
            }
            if (hostedDomain != null && !hostedDomain.isEmpty()) {
                option.setHostedDomainFilter(hostedDomain);
            }
            launch(new GetCredentialRequest.Builder().addCredentialOption(option.build()).build(), callback);
        } catch (Exception e) {
            logger.error("Failed to start the Sign in with Google button flow", e);
            callback.onError(new AuthException(AuthErrorCodes.SIGN_IN_FAILED,
                    "Failed to start the Sign in with Google button flow: " + describe(e), e));
        }
    }

    /** Clears Credential Manager's selected-account state; {@code done} runs whatever the outcome. */
    void clearState(Runnable done) {
        try {
            CredentialManager.create(context).clearCredentialStateAsync(
                    new ClearCredentialStateRequest(), null, ContextCompat.getMainExecutor(context),
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        @Override
                        public void onResult(Void unused) {
                            done.run();
                        }

                        @Override
                        public void onError(ClearCredentialException e) {
                            logger.error("Failed to clear Credential Manager state", e);
                            done.run();
                        }
                    });
        } catch (Exception e) {
            logger.error("Error clearing Credential Manager state", e);
            done.run();
        }
    }

    private void launch(GetCredentialRequest request, final GoogleProfileCallback callback) {
        if (activity == null) {
            callback.onError(new AuthException(AuthErrorCodes.PROVIDER_NOT_INITIALIZED,
                    "Google sign-in requires a foreground Activity."));
            return;
        }
        CredentialManager.create(context).getCredentialAsync(activity, request, null, ContextCompat.getMainExecutor(context),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        handleResponse(response, callback);
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        callback.onError(mapError(e));
                    }
                });
    }

    private void handleResponse(GetCredentialResponse response, GoogleProfileCallback callback) {
        try {
            Credential credential = response.getCredential();
            if (credential instanceof CustomCredential
                    && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                GoogleIdTokenCredential google = GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());
                Uri photo = google.getProfilePictureUri();
                logger.info("Google sign-in successful (Credential Manager)");
                callback.onSuccess(new GoogleResultMapper.Profile(google.getIdToken(), google.getId(),
                        google.getDisplayName(), photo != null ? photo.toString() : null, null, null));
            } else {
                String type = credential != null ? credential.getType() : "null";
                logger.error("Unexpected credential type from Credential Manager: " + type, null);
                callback.onError(new AuthException(AuthErrorCodes.INVALID_CREDENTIALS,
                        "Unexpected credential type returned from Google sign-in: " + type));
            }
        } catch (Exception e) {
            logger.error("Unexpected error handling Google credential", e);
            callback.onError(new AuthException(AuthErrorCodes.INVALID_CREDENTIALS,
                    "Could not read the Google credential: " + describe(e), e));
        }
    }

    /** Keeps Google's own class + message ({@code [28444] …}) and names the package + signing SHA-1. */
    private AuthException mapError(GetCredentialException e) {
        if (e instanceof GetCredentialCancellationException) {
            logger.info("Google sign-in cancelled by user");
            return new AuthException(AuthErrorCodes.USER_CANCELLED, "User cancelled Google sign-in", e);
        }
        if (e instanceof GetCredentialInterruptedException) {
            logger.warn("Google sign-in interrupted: " + describe(e));
            return new AuthException(AuthErrorCodes.NETWORK_ERROR,
                    "Google sign-in was interrupted (" + describe(e) + "). Try again.", e);
        }
        if (e instanceof NoCredentialException) {
            logger.warn("No Google credential offered: " + describe(e));
            return new NoGoogleCredentialException("No Google account was offered (" + describe(e) + "; "
                    + SigningDiagnostics.describe(context) + "). Check a Google account is on the device and an "
                    + "Android OAuth client exists for this package + SHA-1 in the serverClientId's Google Cloud project.", e);
        }
        logger.error("Google sign-in failed: " + describe(e), e);
        return new AuthException(AuthErrorCodes.SIGN_IN_FAILED,
                "Google sign-in failed (" + describe(e) + "; " + SigningDiagnostics.describe(context) + ")", e);
    }

    private static String describe(Exception e) {
        return e.getClass().getSimpleName() + ": " + e.getMessage();
    }
}
