package com.aoneahsan.capacitor_auth_manager;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class AuthStorage {
    private static final String PREFS_NAME = "cap_auth_prefs";
    private static final String KEY_PREFIX = "cap_auth_";
    
    private final Context context;

    // Disk storage holds profile metadata only. Credentials stay in process memory.
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
        // Remove the old encrypted credential store when upgrading to the metadata-only layout.
        context.deleteSharedPreferences(PREFS_NAME);
        sharedPreferences = context.getSharedPreferences("cap_auth_metadata", Context.MODE_PRIVATE);
    }

    public void setPersistence(String persistence) {
        this.persistence = persistence;
    }
    
    /** Metadata storage is not encrypted; bearer credentials are never written here. */
    public boolean isEncrypted() {
        return false;
    }

    public String get(String key) {
        if (persistence.equals(Persistence.NONE.getValue())) {
            return null;
        }
        if (sharedPreferences == null || persistence.equals(Persistence.SESSION.getValue())) {
            return memoryStore.get(KEY_PREFIX + key);
        }
        return sharedPreferences.getString(KEY_PREFIX + key, null);
    }
    
    public void set(String key, String value) {
        if (persistence.equals(Persistence.NONE.getValue())) {
            return;
        }
        if (sharedPreferences == null || persistence.equals(Persistence.SESSION.getValue())) {
            memoryStore.put(KEY_PREFIX + key, value);
            return;
        }
        sharedPreferences.edit().putString(KEY_PREFIX + key, value).apply();
    }
    
    public void remove(String key) {
        if (sharedPreferences == null || persistence.equals(Persistence.SESSION.getValue())) {
            memoryStore.remove(KEY_PREFIX + key);
            return;
        }
        sharedPreferences.edit().remove(KEY_PREFIX + key).apply();
    }
    
    public void clear() {
        memoryStore.clear();
        if (sharedPreferences == null || persistence.equals(Persistence.SESSION.getValue())) {
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

    // Profile metadata respects the configured persistence; credentials remain in memory.
    public void saveUser(String provider, JSObject user) {
        if (user != null) set("user_" + provider, user.toString());
    }

    public JSObject getUser(String provider) {
        String json = get("user_" + provider);
        try { return json == null ? null : JSObject.fromJSONObject(new JSONObject(json)); }
        catch (JSONException invalidProfile) { return null; }
    }

    public void deleteUser(String provider) { remove("user_" + provider); }

    // Credential storage methods

    public void saveCredential(String provider, JSObject credential) {
        if (credential != null) {
            memoryStore.put("credential_" + provider, credential.toString());
        }
    }

    public JSObject getCredential(String provider) {
        String jsonString = memoryStore.get("credential_" + provider);
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
        memoryStore.remove("credential_" + provider);
        sharedPreferences.edit().remove(KEY_PREFIX + "credential_" + provider).apply();
    }

    public boolean hasCredential(String provider) {
        return getCredential(provider) != null;
    }
}