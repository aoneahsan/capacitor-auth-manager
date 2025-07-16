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

public class AuthStorage {
    private static final String PREFS_NAME = "cap_auth_prefs";
    private static final String KEY_PREFIX = "cap_auth_";
    
    private final Context context;
    private SharedPreferences sharedPreferences;
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
            // Fallback to regular shared preferences
            sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        }
    }
    
    public void setPersistence(String persistence) {
        this.persistence = persistence;
    }
    
    public String get(String key) {
        if (persistence.equals(Persistence.NONE.getValue())) {
            return null;
        }
        return sharedPreferences.getString(KEY_PREFIX + key, null);
    }
    
    public void set(String key, String value) {
        if (persistence.equals(Persistence.NONE.getValue())) {
            return;
        }
        sharedPreferences.edit().putString(KEY_PREFIX + key, value).apply();
    }
    
    public void remove(String key) {
        sharedPreferences.edit().remove(KEY_PREFIX + key).apply();
    }
    
    public void clear() {
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
}