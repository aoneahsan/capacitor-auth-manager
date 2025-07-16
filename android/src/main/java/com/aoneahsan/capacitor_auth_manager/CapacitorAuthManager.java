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

            // Initialize providers
            // TODO: Initialize providers based on configuration

            isInitialized = true;
            logger.info("Auth manager initialized successfully");
            callback.onResult(AuthResult.success(null));
        } catch (Exception e) {
            logger.error("Failed to initialize auth manager", e);
            callback.onResult(AuthResult.error(e));
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

        // TODO: Create and configure provider
        callback.onResult(AuthResult.success(null));
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
        callback.onResult(AuthResult.error(new Exception("Operation not supported")));
    }

    public void sendEmailVerification(JSObject options, AuthCallback<Void> callback) {
        callback.onResult(AuthResult.error(new Exception("Operation not supported")));
    }

    public void sendSmsCode(String phoneNumber, String recaptchaToken, String testCode, AuthCallback<Void> callback) {
        callback.onResult(AuthResult.error(new Exception("Operation not supported")));
    }

    public void verifySmsCode(String phoneNumber, String code, String verificationId, AuthCallback<JSObject> callback) {
        callback.onResult(AuthResult.error(new Exception("Operation not supported")));
    }

    public void sendEmailCode(String email, String recaptchaToken, String testCode, AuthCallback<Void> callback) {
        callback.onResult(AuthResult.error(new Exception("Operation not supported")));
    }

    public void verifyEmailCode(String email, String code, String verificationId, AuthCallback<JSObject> callback) {
        callback.onResult(AuthResult.error(new Exception("Operation not supported")));
    }

    public void updateProfile(JSObject options, AuthCallback<JSObject> callback) {
        callback.onResult(AuthResult.error(new Exception("Operation not supported")));
    }

    public void deleteAccount(JSObject options, AuthCallback<Void> callback) {
        callback.onResult(AuthResult.error(new Exception("Operation not supported")));
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