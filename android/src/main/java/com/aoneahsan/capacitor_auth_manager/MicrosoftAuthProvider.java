package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;

import com.getcapacitor.JSObject;
import com.microsoft.identity.client.AcquireTokenParameters;
import com.microsoft.identity.client.AcquireTokenSilentParameters;
import com.microsoft.identity.client.AuthenticationCallback;
import com.microsoft.identity.client.IAccount;
import com.microsoft.identity.client.IAuthenticationResult;
import com.microsoft.identity.client.IPublicClientApplication;
import com.microsoft.identity.client.ISingleAccountPublicClientApplication;
import com.microsoft.identity.client.Prompt;
import com.microsoft.identity.client.PublicClientApplication;
import com.microsoft.identity.client.SilentAuthenticationCallback;
import com.microsoft.identity.client.exception.MsalClientException;
import com.microsoft.identity.client.exception.MsalException;
import com.microsoft.identity.client.exception.MsalServiceException;
import com.microsoft.identity.client.exception.MsalUiRequiredException;

import org.json.JSONArray;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class MicrosoftAuthProvider implements BaseAuthProvider {
    private static final String TAG = "MicrosoftAuthProvider";

    private final Context context;
    private final Activity activity;
    private final AuthStorage storage;
    private final AuthLogger logger;

    private String clientId;
    private String authority;
    private String redirectUri;
    private List<String> scopes;
    private ISingleAccountPublicClientApplication msalApplication;
    private JSObject currentUser;
    private IAccount currentAccount;

    public MicrosoftAuthProvider(Context context, Activity activity, AuthStorage storage, AuthLogger logger) {
        this.context = context;
        this.activity = activity;
        this.storage = storage;
        this.logger = logger;
        this.scopes = new ArrayList<>(Arrays.asList("openid", "profile", "email"));
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public void setAuthority(String authority) {
        this.authority = authority;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public void setScopes(List<String> scopes) {
        if (scopes != null && !scopes.isEmpty()) {
            this.scopes = scopes;
        }
    }

    @Override
    public void initialize(CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Initializing Microsoft auth provider");

        if (clientId == null || clientId.isEmpty()) {
            callback.onResult(CapacitorAuthManager.AuthResult.error(
                    new Exception("Microsoft client ID is required")));
            return;
        }

        try {
            // Build MSAL configuration JSON
            String configJson = buildMsalConfig();

            PublicClientApplication.createSingleAccountPublicClientApplication(
                    context,
                    configJson,
                    new IPublicClientApplication.ISingleAccountApplicationCreatedListener() {
                        @Override
                        public void onCreated(ISingleAccountPublicClientApplication application) {
                            msalApplication = application;
                            loadAccount(callback);
                        }

                        @Override
                        public void onError(MsalException exception) {
                            logger.error("Failed to create MSAL application", exception);
                            callback.onResult(CapacitorAuthManager.AuthResult.error(exception));
                        }
                    }
            );
        } catch (Exception e) {
            logger.error("Failed to initialize Microsoft auth", e);
            callback.onResult(CapacitorAuthManager.AuthResult.error(e));
        }
    }

    private String buildMsalConfig() {
        StringBuilder config = new StringBuilder();
        config.append("{");
        config.append("\"client_id\": \"").append(clientId).append("\",");

        if (authority != null && !authority.isEmpty()) {
            config.append("\"authorities\": [{");
            config.append("\"type\": \"AAD\",");
            config.append("\"authority_url\": \"").append(authority).append("\",");
            config.append("\"default\": true");
            config.append("}],");
        } else {
            config.append("\"authorities\": [{");
            config.append("\"type\": \"AAD\",");
            config.append("\"authority_url\": \"https://login.microsoftonline.com/common\",");
            config.append("\"default\": true");
            config.append("}],");
        }

        if (redirectUri != null && !redirectUri.isEmpty()) {
            config.append("\"redirect_uri\": \"").append(redirectUri).append("\",");
        }

        config.append("\"account_mode\": \"SINGLE\"");
        config.append("}");

        return config.toString();
    }

    private void loadAccount(CapacitorAuthManager.AuthCallback<Void> callback) {
        if (msalApplication == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            return;
        }

        msalApplication.getCurrentAccountAsync(new ISingleAccountPublicClientApplication.CurrentAccountCallback() {
            @Override
            public void onAccountLoaded(IAccount activeAccount) {
                if (activeAccount != null) {
                    currentAccount = activeAccount;
                    currentUser = createUserObject(activeAccount);
                    logger.info("Restored previous Microsoft session");
                }
                callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            }

            @Override
            public void onAccountChanged(IAccount priorAccount, IAccount currentAccount) {
                if (currentAccount != null) {
                    MicrosoftAuthProvider.this.currentAccount = currentAccount;
                    MicrosoftAuthProvider.this.currentUser = createUserObject(currentAccount);
                }
                callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            }

            @Override
            public void onError(MsalException exception) {
                logger.error("Failed to load Microsoft account", exception);
                callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            }
        });
    }

    @Override
    public void signIn(JSObject credentials, JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        logger.info("Starting Microsoft sign-in");

        if (msalApplication == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.error(
                    new Exception("Microsoft Auth not initialized. Call initialize first.")));
            return;
        }

        String[] scopeArray = scopes.toArray(new String[0]);

        AcquireTokenParameters parameters = new AcquireTokenParameters.Builder()
                .startAuthorizationFromActivity(activity)
                .withScopes(Arrays.asList(scopeArray))
                .withPrompt(Prompt.SELECT_ACCOUNT)
                .withCallback(new AuthenticationCallback() {
                    @Override
                    public void onCancel() {
                        logger.warn("Microsoft sign-in cancelled by user");
                        callback.onResult(CapacitorAuthManager.AuthResult.error(
                                new Exception("User cancelled sign-in")));
                    }

                    @Override
                    public void onSuccess(IAuthenticationResult authenticationResult) {
                        handleAuthResult(authenticationResult, callback);
                    }

                    @Override
                    public void onError(MsalException exception) {
                        logger.error("Microsoft sign-in failed", exception);
                        callback.onResult(CapacitorAuthManager.AuthResult.error(exception));
                    }
                })
                .build();

        msalApplication.acquireToken(parameters);
    }

    private void handleAuthResult(IAuthenticationResult authResult, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        currentAccount = authResult.getAccount();
        currentUser = createUserObject(currentAccount);

        JSObject credential = createCredentialObject(authResult);
        storage.saveCredential("microsoft", credential);

        JSObject result = createAuthResultObject(authResult);
        logger.info("Microsoft sign-in successful");
        callback.onResult(CapacitorAuthManager.AuthResult.success(result));
    }

    @Override
    public void signOut(JSObject options, CapacitorAuthManager.AuthCallback<Void> callback) {
        logger.info("Signing out from Microsoft");

        if (msalApplication == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            return;
        }

        msalApplication.signOut(new ISingleAccountPublicClientApplication.SignOutCallback() {
            @Override
            public void onSignOut() {
                currentUser = null;
                currentAccount = null;
                storage.deleteCredential("microsoft");
                callback.onResult(CapacitorAuthManager.AuthResult.success(null));
            }

            @Override
            public void onError(MsalException exception) {
                logger.error("Microsoft sign-out failed", exception);
                callback.onResult(CapacitorAuthManager.AuthResult.error(exception));
            }
        });
    }

    @Override
    public void getCurrentUser(CapacitorAuthManager.AuthCallback<JSObject> callback) {
        if (currentUser != null) {
            callback.onResult(CapacitorAuthManager.AuthResult.success(currentUser));
        } else if (msalApplication != null) {
            msalApplication.getCurrentAccountAsync(new ISingleAccountPublicClientApplication.CurrentAccountCallback() {
                @Override
                public void onAccountLoaded(IAccount activeAccount) {
                    if (activeAccount != null) {
                        currentAccount = activeAccount;
                        currentUser = createUserObject(activeAccount);
                        callback.onResult(CapacitorAuthManager.AuthResult.success(currentUser));
                    } else {
                        callback.onResult(CapacitorAuthManager.AuthResult.success(null));
                    }
                }

                @Override
                public void onAccountChanged(IAccount priorAccount, IAccount currentAccount) {
                    if (currentAccount != null) {
                        MicrosoftAuthProvider.this.currentAccount = currentAccount;
                        MicrosoftAuthProvider.this.currentUser = createUserObject(currentAccount);
                        callback.onResult(CapacitorAuthManager.AuthResult.success(MicrosoftAuthProvider.this.currentUser));
                    } else {
                        callback.onResult(CapacitorAuthManager.AuthResult.success(null));
                    }
                }

                @Override
                public void onError(MsalException exception) {
                    callback.onResult(CapacitorAuthManager.AuthResult.success(null));
                }
            });
        } else {
            callback.onResult(CapacitorAuthManager.AuthResult.success(null));
        }
    }

    @Override
    public void refreshToken(JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        logger.info("Refreshing Microsoft token");

        if (msalApplication == null || currentAccount == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.error(
                    new Exception("Microsoft Auth not initialized or no account")));
            return;
        }

        String[] scopeArray = scopes.toArray(new String[0]);

        AcquireTokenSilentParameters parameters = new AcquireTokenSilentParameters.Builder()
                .fromAuthority(currentAccount.getAuthority())
                .withScopes(Arrays.asList(scopeArray))
                .forAccount(currentAccount)
                .forceRefresh(true)
                .withCallback(new SilentAuthenticationCallback() {
                    @Override
                    public void onSuccess(IAuthenticationResult authenticationResult) {
                        JSObject credential = createCredentialObject(authenticationResult);
                        storage.saveCredential("microsoft", credential);

                        JSObject result = createAuthResultObject(authenticationResult);
                        result.put("operationType", "refresh");
                        callback.onResult(CapacitorAuthManager.AuthResult.success(result));
                    }

                    @Override
                    public void onError(MsalException exception) {
                        if (exception instanceof MsalUiRequiredException) {
                            // Need interactive sign-in
                            signIn(null, null, callback);
                        } else {
                            logger.error("Failed to refresh Microsoft token", exception);
                            callback.onResult(CapacitorAuthManager.AuthResult.error(exception));
                        }
                    }
                })
                .build();

        msalApplication.acquireTokenSilentAsync(parameters);
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
        signOut(null, callback);
    }

    @Override
    public void getIdToken(boolean forceRefresh, CapacitorAuthManager.AuthCallback<JSObject> callback) {
        if (msalApplication == null || currentAccount == null) {
            callback.onResult(CapacitorAuthManager.AuthResult.error(
                    new Exception("Microsoft Auth not initialized or no account")));
            return;
        }

        String[] scopeArray = scopes.toArray(new String[0]);

        AcquireTokenSilentParameters parameters = new AcquireTokenSilentParameters.Builder()
                .fromAuthority(currentAccount.getAuthority())
                .withScopes(Arrays.asList(scopeArray))
                .forAccount(currentAccount)
                .forceRefresh(forceRefresh)
                .withCallback(new SilentAuthenticationCallback() {
                    @Override
                    public void onSuccess(IAuthenticationResult authenticationResult) {
                        JSObject result = new JSObject();
                        result.put("token", authenticationResult.getAccessToken());
                        callback.onResult(CapacitorAuthManager.AuthResult.success(result));
                    }

                    @Override
                    public void onError(MsalException exception) {
                        callback.onResult(CapacitorAuthManager.AuthResult.error(exception));
                    }
                })
                .build();

        msalApplication.acquireTokenSilentAsync(parameters);
    }

    @Override
    public void revokeAccess(String token, CapacitorAuthManager.AuthCallback<Void> callback) {
        // Microsoft requires web-based sign out for full revocation
        signOut(null, callback);
    }

    private JSObject createUserObject(IAccount account) {
        JSObject user = new JSObject();
        user.put("uid", account.getId());
        user.put("email", account.getUsername());
        user.put("emailVerified", account.getUsername() != null && account.getUsername().contains("@"));
        user.put("displayName", account.getUsername());
        user.put("photoURL", null);
        user.put("phoneNumber", null);
        user.put("isAnonymous", false);
        user.put("tenantId", account.getTenantId());

        // Provider data
        JSONArray providerData = new JSONArray();
        JSObject provider = new JSObject();
        provider.put("providerId", "microsoft.com");
        provider.put("uid", account.getId());
        provider.put("displayName", account.getUsername());
        provider.put("email", account.getUsername());
        provider.put("phoneNumber", null);
        provider.put("photoURL", null);
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

    private JSObject createCredentialObject(IAuthenticationResult authResult) {
        JSObject credential = new JSObject();
        credential.put("providerId", "microsoft.com");
        credential.put("signInMethod", "oauth");
        credential.put("accessToken", authResult.getAccessToken());
        credential.put("idToken", authResult.getAccount().getIdToken());
        credential.put("expiresAt", authResult.getExpiresOn().getTime());
        credential.put("tokenType", "Bearer");

        StringBuilder scopeStr = new StringBuilder();
        for (String scope : authResult.getScope()) {
            if (scopeStr.length() > 0) scopeStr.append(" ");
            scopeStr.append(scope);
        }
        credential.put("scope", scopeStr.toString());

        return credential;
    }

    private JSObject createAuthResultObject(IAuthenticationResult authResult) {
        JSObject result = new JSObject();
        result.put("user", createUserObject(authResult.getAccount()));
        result.put("credential", createCredentialObject(authResult));

        JSObject additionalUserInfo = new JSObject();
        additionalUserInfo.put("isNewUser", false);
        additionalUserInfo.put("providerId", "microsoft.com");
        additionalUserInfo.put("username", authResult.getAccount().getUsername());
        result.put("additionalUserInfo", additionalUserInfo);

        result.put("operationType", "signIn");

        return result;
    }
}
