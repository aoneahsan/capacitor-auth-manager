package com.zaions.cap_auth_manager;

import com.getcapacitor.JSObject;

public interface BaseAuthProvider {
    void initialize(CapacitorAuthManager.AuthCallback<Void> callback);
    void signIn(JSObject credentials, JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback);
    void signOut(JSObject options, CapacitorAuthManager.AuthCallback<Void> callback);
    void getCurrentUser(CapacitorAuthManager.AuthCallback<JSObject> callback);
    void refreshToken(JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback);
    void isSupported(CapacitorAuthManager.AuthCallback<Boolean> callback);
    void linkAccount(JSObject credentials, JSObject options, CapacitorAuthManager.AuthCallback<JSObject> callback);
    void unlinkAccount(CapacitorAuthManager.AuthCallback<Void> callback);
    void getIdToken(boolean forceRefresh, CapacitorAuthManager.AuthCallback<JSObject> callback);
    void revokeAccess(String token, CapacitorAuthManager.AuthCallback<Void> callback);
}