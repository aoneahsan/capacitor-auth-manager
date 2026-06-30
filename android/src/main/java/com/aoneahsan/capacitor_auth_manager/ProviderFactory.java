package com.aoneahsan.capacitor_auth_manager;

import android.app.Activity;
import android.content.Context;

import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

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

            case "facebook":
            case "facebook.com":
                return createFacebookProvider(context, activity, storage, logger, config);

            case "microsoft":
            case "microsoft.com":
                return createMicrosoftProvider(context, activity, storage, logger, config);

            case "apple":
            case "apple.com":
                // Apple Sign-In on Android uses web-based flow
                logger.warn("Apple Sign-In requires web-based authentication on Android");
                return null;

            case "github":
            case "github.com":
                // GitHub uses OAuth web flow
                logger.info("GitHub authentication uses OAuth web flow");
                return null;

            case "slack":
            case "slack.com":
                // Slack uses OAuth web flow
                logger.info("Slack authentication uses OAuth web flow");
                return null;

            case "linkedin":
            case "linkedin.com":
                // LinkedIn uses OAuth web flow
                logger.info("LinkedIn authentication uses OAuth web flow");
                return null;

            default:
                logger.warn("Unknown provider type: " + providerType);
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

    private static FacebookAuthProvider createFacebookProvider(
            Context context,
            Activity activity,
            AuthStorage storage,
            AuthLogger logger,
            JSObject config
    ) {
        FacebookAuthProvider provider = new FacebookAuthProvider(context, activity, storage, logger);

        if (config != null) {
            String appId = config.getString("appId");
            if (appId != null) {
                provider.setAppId(appId);
            }

            try {
                JSONArray permissionsArray = config.getJSONArray("permissions");
                if (permissionsArray == null) {
                    permissionsArray = config.getJSONArray("scopes");
                }
                if (permissionsArray != null) {
                    List<String> permissions = new ArrayList<>();
                    for (int i = 0; i < permissionsArray.length(); i++) {
                        permissions.add(permissionsArray.getString(i));
                    }
                    provider.setPermissions(permissions);
                }
            } catch (JSONException e) {
                // Use default permissions
            }
        }

        return provider;
    }

    private static MicrosoftAuthProvider createMicrosoftProvider(
            Context context,
            Activity activity,
            AuthStorage storage,
            AuthLogger logger,
            JSObject config
    ) {
        MicrosoftAuthProvider provider = new MicrosoftAuthProvider(context, activity, storage, logger);

        if (config != null) {
            String clientId = config.getString("clientId");
            if (clientId != null) {
                provider.setClientId(clientId);
            }

            String authority = config.getString("authority");
            if (authority != null) {
                provider.setAuthority(authority);
            }

            String redirectUri = config.getString("redirectUri");
            if (redirectUri != null) {
                provider.setRedirectUri(redirectUri);
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
