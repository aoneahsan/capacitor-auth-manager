package com.aoneahsan.capacitor_auth_manager;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.getcapacitor.JSObject;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.Map;

public class AuthStorage {
    private static final String PREFS_NAME = "cap_auth_prefs";
    private static final String KEY_PREFIX = "cap_auth_";
    
    private final Context context;
    private final AuthLogger logger = new AuthLogger("AuthStorage");

    /**
     * Encrypted preferences, or {@code null} when the Android keystore refused to produce a master
     * key. In that case {@link #memoryStore} takes over: a session that cannot be encrypted is kept
     * in memory for the life of the process rather than written to disk in the clear. ID tokens are
     * bearer credentials, so plaintext {@code MODE_PRIVATE} preferences are not an acceptable
     * fallback (any process with the app's uid, and any backup or rooted device, can read them).
     */
    private SharedPreferences sharedPreferences;
    private final Map<String, String> memoryStore = new HashMap<>();
    private String persistence = "local";
    
    public enum Persistence {
        LOCAL("local"),
        SESSION("session"),
        NONE("none");
        
        private final String value;
        
        Persistence(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    public AuthStorage(Context context) {
        this.context = context;
        initializeStorage();
    }
    
    private void initializeStorage() {
        try {
            // Use encrypted shared preferences for secure storage
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            
            sharedPreferences = EncryptedSharedPreferences.create(
                    context,
                    PREFS_NAME,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (GeneralSecurityException | IOException e) {
            // The keystore is unavailable (a locked device-protected storage, a corrupted master
            // key, an OEM keystore bug). Degrade to memory-only rather than writing tokens in the
            // clear; the user simply has to sign in again after the process dies.
            sharedPreferences = null;
            memoryStore.clear();
            logger.error(
                    "Encrypted storage unavailable; the auth session will be kept in memory only "
                            + "and will not survive app restarts", e);
        }
    }
    
    public void setPersistence(String persistence) {
        this.persistence = persistence;
    }
    
    /** True when values are written to encrypted preferences rather than kept in memory only. */
    public boolean isEncrypted() {
        return sharedPreferences != null;
    }

    public String get(String key) {
        if (persistence.equals(Persistence.NONE.getValue())) {
            return null;
        }
        if (sharedPreferences == null) {
            return memoryStore.get(KEY_PREFIX + key);
        }
        return sharedPreferences.getString(KEY_PREFIX + key, null);
    }
    
    public void set(String key, String value) {
        if (persistence.equals(Persistence.NONE.getValue())) {
            return;
        }
        if (sharedPreferences == null) {
            memoryStore.put(KEY_PREFIX + key, value);
            return;
        }
        sharedPreferences.edit().putString(KEY_PREFIX + key, value).apply();
    }
    
    public void remove(String key) {
        if (sharedPreferences == null) {
            memoryStore.remove(KEY_PREFIX + key);
            return;
        }
        sharedPreferences.edit().remove(KEY_PREFIX + key).apply();
    }
    
    public void clear() {
        if (sharedPreferences == null) {
            memoryStore.clear();
            return;
        }
        SharedPreferences.Editor editor = sharedPreferences.edit();
        for (String key : sharedPreferences.getAll().keySet()) {
            if (key.startsWith(KEY_PREFIX)) {
                editor.remove(key);
            }
        }
        editor.apply();
    }
    
    public void setLastAuthProvider(String provider) {
        set("last_auth_provider", provider);
    }
    
    public String getLastAuthProvider() {
        return get("last_auth_provider");
    }
    
    public void removeLastAuthProvider() {
        remove("last_auth_provider");
    }
    
    public void setCustomParameters(String provider, JSObject parameters) {
        set(provider + "_custom_params", parameters.toString());
    }
    
    public JSObject getCustomParameters(String provider) {
        String jsonString = get(provider + "_custom_params");
        if (jsonString != null) {
            try {
                return JSObject.fromJSONObject(new JSONObject(jsonString));
            } catch (JSONException e) {
                return null;
            }
        }
        return null;
    }

    // Credential storage methods

    public void saveCredential(String provider, JSObject credential) {
        if (credential != null) {
            set("credential_" + provider, credential.toString());
        }
    }

    public JSObject getCredential(String provider) {
        String jsonString = get("credential_" + provider);
        if (jsonString != null) {
            try {
                return JSObject.fromJSONObject(new JSONObject(jsonString));
            } catch (JSONException e) {
                return null;
            }
        }
        return null;
    }

    public void deleteCredential(String provider) {
        remove("credential_" + provider);
    }

    public boolean hasCredential(String provider) {
        return getCredential(provider) != null;
    }
}