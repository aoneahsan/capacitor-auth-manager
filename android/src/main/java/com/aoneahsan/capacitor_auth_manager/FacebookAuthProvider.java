package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookException;
import com.facebook.GraphRequest;
import com.facebook.login.LoginManager;
import com.facebook.login.LoginResult;
import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class FacebookAuthProvider implements BaseAuthProvider {
    private static final String TAG = "FacebookAuthProvider";

    private final Context context;
    private final Activity activity;
    private final AuthStorage storage;
    private final AuthLogger logger;

    private String appId;
    private List<String> permissions;
    private CallbackManager callbackManager;
    private JSObject currentUser;

    private CapacitorAuthManager.AuthCallback<JSObject> pendingCallback;

    public FacebookAuthProvider(Context context, Activity activity, AuthStorage storage, AuthLogger logger) {
        this.context = context;
        this.activity = activity;
        this.storage = storage;
        this.logger = logger;
        this.permissions = new ArrayList<>(Arrays.asList("public_profile", "email"));
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public void setPermissions(List<String> permissions) {
        if (permissions != null && !permissions.isEmpty()) {
            this.permissions = permissions;
        }
    }

    @Override
    public void initialize(CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Initializing Facebook auth provider");

        try {
            callbackManager = CallbackManager.Factory.create();

            LoginManager.getInstance().registerCallback(callbackManager,
                    new FacebookCallback<LoginResult>() {
                        @Override
                        public void onSuccess(LoginResult loginResult) {
                            handleLoginSuccess(loginResult);
                        }

                        @Override
                        public void onCancel() {
                            handleLoginCancel();
                        }

                        @Override
                        public void onError(FacebookException error) {
                            handleLoginError(error);
                        }
                    });

            // Check for existing token
            AccessToken accessToken = AccessToken.getCurrentAccessToken();
            if (accessToken != null && !accessToken.isExpired()) {
                loadCurrentUser(() -> {
                    logger.info("Restored previous Facebook session");
                    callback.onResult(CapacitorAuthManager.AuthResult.success(null));
                });
            } else {
                callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            }
        } catch (Exception e) {
            logger.error("Failed to initialize Facebook auth", e);
            callback.onResult(CapacitorAuthManager.AuthResult.error(e));
        }
    }

    @Override
    public void signIn(JSObject credentials, JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        logger.info("Starting Facebook sign-in");

        if (callbackManager == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.error(
                    new Exception("Facebook Login not initialized. Call initialize first.")));
            return;
        }

        pendingCallback = callback;
        LoginManager.getInstance().logInWithReadPermissions(activity, permissions);
    }

    public void handleActivityResult(int requestCode, int resultCode, Intent data) {
        if (callbackManager != null) {
            callbackManager.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void handleLoginSuccess(LoginResult loginResult) {
        logger.info("Facebook login successful, fetching user data");
        AccessToken token = loginResult.getAccessToken();

        loadCurrentUser(() -> {
            if (currentUser != null) {
                JSObject result = createAuthResult(token);
                storage.saveCredential("facebook", createCredentialObject(token));

                if (pendingCallback != null) {
                    pendingCallback.onResult(CapacitorAuthManager.AuthResult.success(result));
                    pendingCallback = null;
                }
            } else {
                if (pendingCallback != null) {
                    pendingCallback.onResult(CapacitorAuthManager.AuthResult.error(
                            new Exception("Failed to load user data")));
                    pendingCallback = null;
                }
            }
        });
    }

    private void handleLoginCancel() {
        logger.warn("Facebook login cancelled by user");
        if (pendingCallback != null) {
            pendingCallback.onResult(CapacitorAuthManager.AuthResult.error(
                    new Exception("User cancelled sign-in")));
            pendingCallback = null;
        }
    }

    private void handleLoginError(FacebookException error) {
        logger.error("Facebook login error", error);
        if (pendingCallback != null) {
            pendingCallback.onResult(CapacitorAuthManager.AuthResult.error(error));
            pendingCallback = null;
        }
    }

    @Override
    public void signOut(JSObject options, CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Signing out from Facebook");

        LoginManager.getInstance().logOut();
        currentUser = null;
        storage.deleteCredential("facebook");

        callback.onResult(CapacitorAuthManager.AuthResult.success(null));
    }

    @Override
    public void getCurrentUser(CapacitorAuthManager.AuthCallback<JSObject> callback) {
        if (currentUser != null) {
            callback.onResult(CapacitorAuthManager.AuthResult.success(currentUser));
        } else {
            AccessToken token = AccessToken.getCurrentAccessToken();
            if (token != null && !token.isExpired()) {
                loadCurrentUser(() -> {
                    callback.onResult(CapacitorAuthManager.AuthResult.success(currentUser));
                });
            } else {
                callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            }
        }
    }

    @Override
    public void refreshToken(JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        logger.info("Refreshing Facebook token");

        AccessToken currentToken = AccessToken.getCurrentAccessToken();
        if (currentToken == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.error(
                    new Exception("No Facebook token to refresh")));
            return;
        }

        AccessToken.refreshCurrentAccessTokenAsync(new AccessToken.AccessTokenRefreshCallback() {
            @Override
            public void OnTokenRefreshed(AccessToken accessToken) {
                JSObject result = createAuthResult(accessToken);
                result.put("operationType", "refresh");
                storage.saveCredential("facebook", createCredentialObject(accessToken));
                callback.onResult(CapacitorAuthManager.AuthResult.success(result));
            }

            @Override
            public void OnTokenRefreshFailed(FacebookException exception) {
                logger.error("Failed to refresh Facebook token", exception);
                callback.onResult(CapacitorAuthManager.AuthResult.error(exception));
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
    public void getIdToken(boolean forceRefresh, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        // Facebook doesn't provide ID tokens, return access token
        AccessToken token = AccessToken.getCurrentAccessToken();
        if (token != null && !token.isExpired()) {
            if (forceRefresh) {
                AccessToken.refreshCurrentAccessTokenAsync(new AccessToken.AccessTokenRefreshCallback() {
                    @Override
                    public void OnTokenRefreshed(AccessToken accessToken) {
                        JSObject result = new JSObject();
                        result.put("token", accessToken.getToken());
                        callback.onResult(CapacitorAuthManager.AuthResult.success(result));
                    }

                    @Override
                    public void OnTokenRefreshFailed(FacebookException exception) {
                        callback.onResult(CapacitorAuthManager.AuthResult.error(exception));
                    }
                });
            } else {
                JSObject result = new JSObject();
                result.put("token", token.getToken());
                callback.onResult(CapacitorAuthManager.AuthResult.success(result));
            }
        } else {
            callback.onResult(CapacitorAuthManager.AuthResult.error(
                    new Exception("No Facebook token found")));
        }
    }

    @Override
    public void revokeAccess(String token, CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Revoking Facebook access");

        AccessToken currentToken = AccessToken.getCurrentAccessToken();
        if (currentToken == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            return;
        }

        // Delete permissions via Graph API
        GraphRequest request = new GraphRequest(
                currentToken,
                "/me/permissions",
                null,
                com.facebook.HttpMethod.DELETE,
                response -> {
                    LoginManager.getInstance().logOut();
                    currentUser = null;
                    storage.deleteCredential("facebook");
                    callback.onResult(CapacitorAuthManager.AuthResult.success(null));
                }
        );
        request.executeAsync();
    }

    private void loadCurrentUser(Runnable onComplete) {
        AccessToken token = AccessToken.getCurrentAccessToken();
        if (token == null) {
            onComplete.run();
            return;
        }

        GraphRequest request = GraphRequest.newMeRequest(token, (object, response) -> {
            if (object != null) {
                try {
                    currentUser = createUserObject(object, token);
                } catch (Exception e) {
                    logger.error("Failed to parse Facebook user data", e);
                }
            }
            onComplete.run();
        });

        Bundle parameters = new Bundle();
        parameters.putString("fields", "id,name,email,picture.type(large)");
        request.setParameters(parameters);
        request.executeAsync();
    }

    private JSObject createUserObject(JSONObject fbUser, AccessToken token) throws Exception {
        JSObject user = new JSObject();
        user.put("uid", fbUser.getString("id"));
        user.put("email", fbUser.optString("email", null));
        user.put("emailVerified", fbUser.has("email"));
        user.put("displayName", fbUser.optString("name", null));
        user.put("phoneNumber", null);
        user.put("isAnonymous", false);
        user.put("tenantId", null);

        // Photo URL
        String photoURL = null;
        if (fbUser.has("picture")) {
            JSONObject picture = fbUser.getJSONObject("picture");
            if (picture.has("data")) {
                JSONObject data = picture.getJSONObject("data");
                photoURL = data.optString("url", null);
            }
        }
        user.put("photoURL", photoURL);

        // Provider data
        JSONArray providerData = new JSONArray();
        JSObject provider = new JSObject();
        provider.put("providerId", "facebook.com");
        provider.put("uid", fbUser.getString("id"));
        provider.put("displayName", fbUser.optString("name", null));
        provider.put("email", fbUser.optString("email", null));
        provider.put("phoneNumber", null);
        provider.put("photoURL", photoURL);
        providerData.put(provider);
        user.put("providerData", providerData);

        // Metadata
        JSObject metadata = new JSObject();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        metadata.put("lastSignInTime", sdf.format(new Date()));
        user.put("metadata", metadata);

        return user;
    }

    private JSObject createCredentialObject(AccessToken token) {
        JSObject credential = new JSObject();
        credential.put("providerId", "facebook.com");
        credential.put("signInMethod", "oauth");
        credential.put("accessToken", token.getToken());
        credential.put("expiresAt", token.getExpires().getTime());
        credential.put("tokenType", "Bearer");

        if (token.getPermissions() != null) {
            StringBuilder permStr = new StringBuilder();
            for (String perm : token.getPermissions()) {
                if (permStr.length() > 0) permStr.append(" ");
                permStr.append(perm);
            }
            credential.put("scope", permStr.toString());
        }

        return credential;
    }

    private JSObject createAuthResult(AccessToken token) {
        JSObject result = new JSObject();
        result.put("user", currentUser);
        result.put("credential", createCredentialObject(token));

        JSObject additionalUserInfo = new JSObject();
        additionalUserInfo.put("isNewUser", false);
        additionalUserInfo.put("providerId", "facebook.com");
        result.put("additionalUserInfo", additionalUserInfo);

        result.put("operationType", "signIn");

        return result;
    }
}
