package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;

import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

/**
 * Creates native auth providers. As of 2.4.x the plugin is Google-first: only the Google provider is
 * built. The Facebook / Microsoft native implementations were moved to
 * {@code android/disabled-native-providers/} (out of the compiled source set + not shipped) so the
 * plugin no longer drags the Facebook SDK / MSAL into every consumer app. Re-add a provider's case here
 * (and its dependency in build.gradle, and move its file back) when it is re-enabled.
 */
public class ProviderFactory {
    private static final String TAG = "ProviderFactory";

    public static BaseAuthProvider createProvider(
            String providerType,
            Context context,
            Activity activity,
            AuthStorage storage,
            AuthLogger logger,
            JSObject config
    ) {
        if (providerType == null) {
            return null;
        }

        switch (providerType.toLowerCase()) {
            case "google":
            case "google.com":
                return createGoogleProvider(context, activity, storage, logger, config);

            default:
                // Every non-Google provider is disabled in the Google-first build. The JS layer already
                // reports AuthErrorCode.PROVIDER_NOT_ENABLED before reaching native; this is a safety net.
                logger.warn("Provider '" + providerType + "' is not enabled yet (Google-only build).");
                return null;
        }
    }

    private static GoogleAuthProvider createGoogleProvider(
            Context context,
            Activity activity,
            AuthStorage storage,
            AuthLogger logger,
            JSObject config
    ) {
        GoogleAuthProvider provider = new GoogleAuthProvider(context, activity, storage, logger);

        if (config != null) {
            String clientId = config.getString("clientId");
            if (clientId != null) {
                provider.setClientId(clientId);
            }

            // Web (server) OAuth client id — REQUIRED by Credential Manager to receive an idToken.
            String serverClientId = config.getString("serverClientId");
            if (serverClientId != null) {
                provider.setServerClientId(serverClientId);
            }

            if (config.has("filterByAuthorizedAccounts")) {
                provider.setFilterByAuthorizedAccounts(config.optBoolean("filterByAuthorizedAccounts", false));
            }
            if (config.has("autoSelectEnabled")) {
                provider.setAutoSelectEnabled(config.optBoolean("autoSelectEnabled", false));
            }

            String nonce = config.getString("nonce");
            if (nonce != null) {
                provider.setNonce(nonce);
            }

            String hostedDomain = config.getString("hostedDomain");
            if (hostedDomain != null) {
                provider.setHostedDomain(hostedDomain);
            }

            String loginHint = config.getString("loginHint");
            if (loginHint != null) {
                provider.setLoginHint(loginHint);
            }

            String androidFlow = config.getString("androidFlow");
            if (androidFlow != null) {
                provider.setAndroidFlow(androidFlow);
            }

            try {
                JSONArray scopesArray = config.getJSONArray("scopes");
                if (scopesArray != null) {
                    List<String> scopes = new ArrayList<>();
                    for (int i = 0; i < scopesArray.length(); i++) {
                        scopes.add(scopesArray.getString(i));
                    }
                    provider.setScopes(scopes);
                }
            } catch (JSONException e) {
                // Use default scopes
            }
        }

        return provider;
    }
}
