# Shipped into every consuming app's R8 run (consumerProguardFiles). android/proguard-rules.pro only
# applies to this library's own unminified build, so any rule a release app needs must live here.

# Capacitor discovers plugin entry points and invokes methods by reflection.
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class com.aoneahsan.capacitor_auth_manager.** { *; }

# Credential Manager finds its Play Services provider by class name from the merged manifest.
-keep class androidx.credentials.playservices.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }

# Legacy GoogleSignIn fallback (play-services-auth 21.x).
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.ApiException { *; }
