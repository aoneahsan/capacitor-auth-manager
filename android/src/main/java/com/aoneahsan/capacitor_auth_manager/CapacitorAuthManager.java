package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSObject;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class CapacitorAuthManager {
    private static final String TAG = "CapacitorAuthManager";

    private final Context context;
    private final Activity activity;
    private final Map<String, BaseAuthProvider> providers;
    private final AuthStorage storage;
    private final AuthLogger logger;
    private final Map<String, AuthStateListener> authStateListeners;
    private String currentProvider;
    private boolean isInitialized;

    public CapacitorAuthManager(Context context, Activity activity) {
        this.context = context;
        this.activity = activity;
        this.providers = new HashMap<>();
        this.storage = new AuthStorage(context);
        this.logger = new AuthLogger(TAG);
        this.authStateListeners = new HashMap<>();
        this.isInitialized = false;
    }

    public void initialize(JSObject options, AuthCallback<Void> callback) {
        if (isInitialized) {
            logger.warn("Auth manager already initialized");
            callback.onResult(AuthResult.success(null));
            return;
        }

        try {
            // Configure logger
            if (options.has("enableLogging")) {
                logger.setEnabled(options.getBoolean("enableLogging"));
            }
            if (options.has("logLevel")) {
                logger.setLogLevel(options.getString("logLevel"));
            }

            // Configure persistence
            if (options.has("persistence")) {
                storage.setPersistence(options.getString("persistence"));
            }

            // Initialize providers from configuration.
            // The JS bridge sends `providers` as an ARRAY of { provider, options }
            // (see AuthManagerInitOptions/AuthProviderConfig in definitions.ts). A legacy
            // keyed-map form ({ google: {...} }) is also accepted for backward compatibility.
            if (options.has("providers")) {
                try {
                    Object providersRaw = options.opt("providers");
                    if (providersRaw instanceof org.json.JSONArray) {
                        org.json.JSONArray providersArray = (org.json.JSONArray) providersRaw;
                        for (int i = 0; i < providersArray.length(); i++) {
                            org.json.JSONObject entry = providersArray.optJSONObject(i);
                            if (entry == null) {
                                continue;
                            }
                            String providerName = entry.optString("provider", null);
                            if (providerName == null || providerName.isEmpty()) {
                                continue;
                            }
                            org.json.JSONObject providerOptions = entry.optJSONObject("options");
                            JSObject configObj = providerOptions != null
                                    ? JSObject.fromJSONObject(providerOptions)
                                    : new JSObject();
                            registerProviderFromConfig(providerName, configObj);
                        }
                    } else if (providersRaw instanceof org.json.JSONObject) {
                        org.json.JSONObject providersConfig = (org.json.JSONObject) providersRaw;
                        java.util.Iterator<String> keys = providersConfig.keys();
                        while (keys.hasNext()) {
                            String providerName = keys.next();
                            org.json.JSONObject providerOptions = providersConfig.getJSONObject(providerName);
                            JSObject configObj = JSObject.fromJSONObject(providerOptions);
                            registerProviderFromConfig(providerName, configObj);
                        }
                    }
                } catch (Exception e) {
                    logger.error("Failed to configure providers", e);
                }
            }

            // Initialize all registered providers
            initializeAllProviders(() -> {
                isInitialized = true;
                logger.info("Auth manager initialized successfully");
                callback.onResult(AuthResult.success(null));
            });
            return;
        } catch (Exception e) {
            logger.error("Failed to initialize auth manager", e);
            callback.onResult(AuthResult.error(e));
        }
    }

    private void registerProviderFromConfig(String providerName, JSObject configObj) {
        try {
            BaseAuthProvider provider = ProviderFactory.createProvider(
                    providerName, context, activity, storage, logger, configObj);
            if (provider != null) {
                providers.put(providerName, provider);
                logger.info("Registered provider: " + providerName);
            }
        } catch (Exception e) {
            logger.error("Failed to register provider: " + providerName, e);
        }
    }

    private void initializeAllProviders(Runnable onComplete) {
        if (providers.isEmpty()) {
            onComplete.run();
            return;
        }

        final int[] remaining = {providers.size()};

        for (BaseAuthProvider provider : providers.values()) {
            provider.initialize(result -> {
                remaining[0]--;
                if (remaining[0] <= 0) {
                    onComplete.run();
                }
            });
        }
    }

    public void signIn(String provider, JSObject credentials, JSObject options, AuthCallback<JSObject> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        BaseAuthProvider authProvider = providers.get(provider);
        if (authProvider == null) {
            callback.onResult(AuthResult.error(new Exception("Provider " + provider + " not configured")));
            return;
        }

        authProvider.signIn(credentials, options, result -> {
            if (result.isSuccess()) {
                currentProvider = provider;
                storage.setLastAuthProvider(provider);
                notifyAuthStateChange(result.getData());
            }
            callback.onResult(result);
        });
    }

    public void signOut(JSObject options, AuthCallback<Void> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        String provider = options != null && options.has("provider") ? options.getString("provider") : currentProvider;
        
        if (provider != null) {
            BaseAuthProvider authProvider = providers.get(provider);
            if (authProvider != null) {
                authProvider.signOut(options, result -> {
                    if (result.isSuccess()) {
                        if (provider.equals(currentProvider)) {
                            currentProvider = null;
                            storage.removeLastAuthProvider();
                        }
                        notifyAuthStateChange(null);
                    }
                    callback.onResult(result);
                });
            } else {
                callback.onResult(AuthResult.error(new Exception("Provider " + provider + " not found")));
            }
        } else {
            // Sign out from all providers
            for (BaseAuthProvider authProvider : providers.values()) {
                authProvider.signOut(options, result -> {});
            }
            currentProvider = null;
            storage.removeLastAuthProvider();
            notifyAuthStateChange(null);
            callback.onResult(AuthResult.success(null));
        }
    }

    public void getCurrentUser(AuthCallback<JSObject> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        if (currentProvider != null) {
            BaseAuthProvider provider = providers.get(currentProvider);
            if (provider != null) {
                provider.getCurrentUser(callback);
                return;
            }
        }

        // Try to get user from any provider
        for (BaseAuthProvider provider : providers.values()) {
            provider.getCurrentUser(result -> {
                if (result.isSuccess() && result.getData() != null) {
                    callback.onResult(result);
                    return;
                }
            });
        }

        callback.onResult(AuthResult.success(null));
    }

    public void refreshToken(JSObject options, AuthCallback<JSObject> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        String provider = options != null && options.has("provider") ? options.getString("provider") : currentProvider;
        
        if (provider == null) {
            callback.onResult(AuthResult.error(new Exception("No provider specified")));
            return;
        }

        BaseAuthProvider authProvider = providers.get(provider);
        if (authProvider == null) {
            callback.onResult(AuthResult.error(new Exception("Provider " + provider + " not configured")));
            return;
        }

        authProvider.refreshToken(options, callback);
    }

    public String addAuthStateListener(AuthStateListener listener) {
        String callbackId = UUID.randomUUID().toString();
        authStateListeners.put(callbackId, listener);
        
        // Emit current state
        getCurrentUser(result -> {
            if (result.isSuccess()) {
                listener.onAuthStateChange(result.getData());
            }
        });
        
        return callbackId;
    }

    public void removeAuthStateListener(String callbackId) {
        authStateListeners.remove(callbackId);
    }

    public void removeAllListeners() {
        authStateListeners.clear();
    }

    public void isSupported(String provider, AuthCallback<JSObject> callback) {
        JSObject result = new JSObject();
        result.put("isSupported", providers.containsKey(provider));
        
        if (!providers.containsKey(provider)) {
            result.put("reason", "Provider not configured");
        }
        
        // Add available providers
        JSObject availableProviders = new JSObject();
        for (String key : providers.keySet()) {
            availableProviders.put(key, true);
        }
        result.put("availableProviders", availableProviders);
        
        callback.onResult(AuthResult.success(result));
    }

    public void configure(String provider, JSObject options, AuthCallback<Void> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        try {
            BaseAuthProvider authProvider = ProviderFactory.createProvider(
                    provider, context, activity, storage, logger, options);

            if (authProvider != null) {
                providers.put(provider, authProvider);
                authProvider.initialize(result -> {
                    if (result.isSuccess()) {
                        logger.info("Provider " + provider + " configured successfully");
                        callback.onResult(AuthResult.success(null));
                    } else {
                        callback.onResult(AuthResult.error(result.getError()));
                    }
                });
            } else {
                callback.onResult(AuthResult.error(new Exception("Unknown provider: " + provider)));
            }
        } catch (Exception e) {
            logger.error("Failed to configure provider: " + provider, e);
            callback.onResult(AuthResult.error(e));
        }
    }

    public void linkAccount(String provider, JSObject credentials, JSObject options, AuthCallback<JSObject> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        BaseAuthProvider authProvider = providers.get(provider);
        if (authProvider == null) {
            callback.onResult(AuthResult.error(new Exception("Provider " + provider + " not configured")));
            return;
        }

        authProvider.linkAccount(credentials, options, callback);
    }

    public void unlinkAccount(String provider, AuthCallback<Void> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        BaseAuthProvider authProvider = providers.get(provider);
        if (authProvider == null) {
            callback.onResult(AuthResult.error(new Exception("Provider " + provider + " not configured")));
            return;
        }

        authProvider.unlinkAccount(callback);
    }

    public void sendPasswordResetEmail(String email, JSObject actionCodeSettings, AuthCallback<Void> callback) {
        // Password reset is not supported on Android native - requires web-based email/password provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        callback.onResult(AuthResult.error(new UnsupportedOperationException(
                "sendPasswordResetEmail is not supported on Android. This method requires web-based providers. " +
                "See docs/api-reference/CAPABILITY_MATRIX.md for platform support details.")));
    }

    public void sendEmailVerification(JSObject options, AuthCallback<Void> callback) {
        // Email verification is not supported on Android native - requires web-based email/password provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        callback.onResult(AuthResult.error(new UnsupportedOperationException(
                "sendEmailVerification is not supported on Android. This method requires web-based providers. " +
                "See docs/api-reference/CAPABILITY_MATRIX.md for platform support details.")));
    }

    public void sendSmsCode(String phoneNumber, String recaptchaToken, String testCode, AuthCallback<Void> callback) {
        // SMS code is not supported on Android native - requires web-based SMS provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        callback.onResult(AuthResult.error(new UnsupportedOperationException(
                "sendSmsCode is not supported on Android. This method requires web-based providers. " +
                "See docs/api-reference/CAPABILITY_MATRIX.md for platform support details.")));
    }

    public void verifySmsCode(String phoneNumber, String code, String verificationId, AuthCallback<JSObject> callback) {
        // SMS verification is not supported on Android native - requires web-based SMS provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        callback.onResult(AuthResult.error(new UnsupportedOperationException(
                "verifySmsCode is not supported on Android. This method requires web-based providers. " +
                "See docs/api-reference/CAPABILITY_MATRIX.md for platform support details.")));
    }

    public void sendEmailCode(String email, String recaptchaToken, String testCode, AuthCallback<Void> callback) {
        // Email code is not supported on Android native - requires web-based email-code provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        callback.onResult(AuthResult.error(new UnsupportedOperationException(
                "sendEmailCode is not supported on Android. This method requires web-based providers. " +
                "See docs/api-reference/CAPABILITY_MATRIX.md for platform support details.")));
    }

    public void verifyEmailCode(String email, String code, String verificationId, AuthCallback<JSObject> callback) {
        // Email code verification is not supported on Android native - requires web-based email-code provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        callback.onResult(AuthResult.error(new UnsupportedOperationException(
                "verifyEmailCode is not supported on Android. This method requires web-based providers. " +
                "See docs/api-reference/CAPABILITY_MATRIX.md for platform support details.")));
    }

    public void updateProfile(JSObject options, AuthCallback<JSObject> callback) {
        // Profile updates are not supported on Android native - OAuth providers manage profiles externally
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        callback.onResult(AuthResult.error(new UnsupportedOperationException(
                "updateProfile is not supported on Android. OAuth providers manage profiles externally. " +
                "See docs/api-reference/CAPABILITY_MATRIX.md for platform support details.")));
    }

    public void deleteAccount(JSObject options, AuthCallback<Void> callback) {
        // Account deletion is not supported on Android native - OAuth providers manage accounts externally
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        callback.onResult(AuthResult.error(new UnsupportedOperationException(
                "deleteAccount is not supported on Android. OAuth providers manage accounts externally. " +
                "See docs/api-reference/CAPABILITY_MATRIX.md for platform support details.")));
    }

    public void getIdToken(JSObject options, AuthCallback<JSObject> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        String provider = options != null && options.has("provider") ? options.getString("provider") : currentProvider;
        
        if (provider == null) {
            callback.onResult(AuthResult.error(new Exception("No provider specified")));
            return;
        }

        BaseAuthProvider authProvider = providers.get(provider);
        if (authProvider == null) {
            callback.onResult(AuthResult.error(new Exception("Provider " + provider + " not configured")));
            return;
        }

        boolean forceRefresh = options != null && options.has("forceRefresh") ? options.getBoolean("forceRefresh") : false;
        authProvider.getIdToken(forceRefresh, callback);
    }

    public void setCustomParameters(String provider, JSObject parameters, AuthCallback<Void> callback) {
        storage.setCustomParameters(provider, parameters);
        callback.onResult(AuthResult.success(null));
    }

    public void revokeAccess(JSObject options, AuthCallback<Void> callback) {
        if (!isInitialized) {
            callback.onResult(AuthResult.error(new Exception("Auth manager not initialized")));
            return;
        }

        String provider = options != null && options.has("provider") ? options.getString("provider") : currentProvider;
        
        if (provider == null) {
            callback.onResult(AuthResult.error(new Exception("No provider specified")));
            return;
        }

        BaseAuthProvider authProvider = providers.get(provider);
        if (authProvider == null) {
            callback.onResult(AuthResult.error(new Exception("Provider " + provider + " not configured")));
            return;
        }

        String token = options != null && options.has("token") ? options.getString("token") : null;
        authProvider.revokeAccess(token, callback);
    }

    private void notifyAuthStateChange(JSObject user) {
        for (AuthStateListener listener : authStateListeners.values()) {
            listener.onAuthStateChange(user);
        }
    }

    // Callback interfaces
    public interface AuthCallback<T> {
        void onResult(AuthResult<T> result);
    }

    public interface AuthStateListener {
        void onAuthStateChange(JSObject user);
    }

    // Result wrapper
    public static class AuthResult<T> {
        private final boolean success;
        private final T data;
        private final Exception error;

        private AuthResult(boolean success, T data, Exception error) {
            this.success = success;
            this.data = data;
            this.error = error;
        }

        public static <T> AuthResult<T> success(T data) {
            return new AuthResult<>(true, data, null);
        }

        public static <T> AuthResult<T> error(Exception error) {
            return new AuthResult<>(false, null, error);
        }

        public boolean isSuccess() {
            return success;
        }

        public T getData() {
            return data;
        }

        public Exception getError() {
            return error;
        }
    }
}