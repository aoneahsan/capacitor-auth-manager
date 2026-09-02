# ProGuard / R8 rules for capacitor-auth-manager (Google-first build).

# Credential Manager + Google Identity (Sign in with Google)
-keep class androidx.credentials.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# Capacitor
-keep class com.getcapacitor.** { *; }

# Plugin classes
-keep class com.aoneahsan.capacitor_auth_manager.** { *; }
