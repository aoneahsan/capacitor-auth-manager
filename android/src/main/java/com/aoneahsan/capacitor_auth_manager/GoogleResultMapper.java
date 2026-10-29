package com.aoneahsan.capacitor_auth_manager;

import android.util.Base64;

import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Builds the Firebase-agnostic sign-in result shared by both Android Google paths — Credential
 * Manager and the legacy GoogleSignIn fallback — so JS receives one shape whichever path ran.
 */
final class GoogleResultMapper {
    static final String PROVIDER_ID = "google.com";

    private GoogleResultMapper() {
    }

    /** Profile fields as each path exposes them; any may be {@code null}. */
    static final class Profile {
        final String idToken;
        final String email;
        final String displayName;
        final String photoURL;
        /** The Google account id ({@code sub}) when the path exposes it directly. */
        final String googleId;
        final String serverAuthCode;

        Profile(String idToken, String email, String displayName, String photoURL, String googleId, String serverAuthCode) {
            this.idToken = idToken;
            this.email = email;
            this.displayName = displayName;
            this.photoURL = photoURL;
            this.googleId = googleId;
            this.serverAuthCode = serverAuthCode;
        }
    }

    /** {@code { user, credential, additionalUserInfo, operationType }}. */
    static JSObject buildResult(Profile profile, AuthLogger logger) {
        JSONObject claims = parseIdTokenClaims(profile.idToken, logger);
        JSObject result = new JSObject();
        result.put("user", createUserObject(profile, claims));
        result.put("credential", createCredentialObject(profile));

        JSObject additionalUserInfo = new JSObject();
        additionalUserInfo.put("isNewUser", false);
        additionalUserInfo.put("providerId", PROVIDER_ID);
        if (profile.email != null) {
            additionalUserInfo.put("username", profile.email);
        }
        result.put("additionalUserInfo", additionalUserInfo);
        result.put("operationType", "signIn");
        return result;
    }

    private static JSObject createUserObject(Profile profile, JSONObject claims) {
        String email = profile.email;
        String displayName = profile.displayName;
        String photoURL = profile.photoURL;
        String uid = profile.googleId;
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
            uid = email;
        }

        JSObject user = new JSObject();
        user.put("uid", uid);
        user.put("email", email);
        user.put("emailVerified", emailVerified);
        user.put("displayName", displayName);
        user.put("photoURL", photoURL);
        user.put("phoneNumber", null); // Google ID tokens do not carry a phone number.
        user.put("isAnonymous", false);

        JSONArray providerData = new JSONArray();
        JSObject providerEntry = new JSObject();
        providerEntry.put("providerId", PROVIDER_ID);
        providerEntry.put("uid", uid);
        providerEntry.put("displayName", displayName);
        providerEntry.put("email", email);
        providerEntry.put("phoneNumber", null);
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

    private static JSObject createCredentialObject(Profile profile) {
        JSObject credential = new JSObject();
        credential.put("providerId", PROVIDER_ID);
        credential.put("signInMethod", PROVIDER_ID);
        credential.put("idToken", profile.idToken);
        if (profile.serverAuthCode != null) {
            credential.put("serverAuthCode", profile.serverAuthCode);
        }
        // No accessToken on either Android path: consumers feed credential.idToken into their own
        // signInWithCredential / signInWithIdToken.
        return credential;
    }

    /**
     * Best-effort decode of the (unverified) ID-token payload to read {@code sub}, {@code email_verified}
     * and {@code exp}. The signature is verified by the consumer's backend; this only enriches the result.
     */
    static JSONObject parseIdTokenClaims(String idToken, AuthLogger logger) {
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
            if (logger != null) {
                logger.warn("Failed to parse Google ID token claims");
            }
            return null;
        }
    }
}
