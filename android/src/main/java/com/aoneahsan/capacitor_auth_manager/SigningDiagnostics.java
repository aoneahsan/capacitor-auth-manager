package com.aoneahsan.capacitor_auth_manager;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;

import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

/**
 * Describes how the running app is signed, for Google sign-in configuration errors.
 *
 * <p>Google matches an Android OAuth client by package name + signing-certificate SHA-1. A build
 * installed from Google Play is re-signed with the <b>Play App Signing</b> key, so its SHA-1 differs
 * from the upload key a locally signed APK carries. When that SHA-1 has no OAuth client, Credential
 * Manager refuses the request before showing any account picker. Naming the installed SHA-1 in the
 * error turns that silent mismatch into one value to register. Certificate fingerprints are public
 * (they are readable from any installed APK), so including them is safe.</p>
 */
final class SigningDiagnostics {

    private SigningDiagnostics() {
    }

    /** {@code "package=com.example.app, signing SHA-1=AA:BB:…"}, or the package alone if unreadable. */
    static String describe(Context context) {
        String packageName = context.getPackageName();
        List<String> fingerprints = signingSha1(context);
        if (fingerprints.isEmpty()) {
            return "package=" + packageName;
        }
        return "package=" + packageName + ", signing SHA-1=" + String.join(" | ", fingerprints);
    }

    @SuppressWarnings("deprecation")
    private static List<String> signingSha1(Context context) {
        List<String> out = new ArrayList<>();
        try {
            PackageManager pm = context.getPackageManager();
            Signature[] signatures;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageInfo info = pm.getPackageInfo(context.getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
                signatures = info.signingInfo == null ? null
                        : (info.signingInfo.hasMultipleSigners()
                            ? info.signingInfo.getApkContentsSigners()
                            : info.signingInfo.getSigningCertificateHistory());
            } else {
                signatures = pm.getPackageInfo(context.getPackageName(), PackageManager.GET_SIGNATURES).signatures;
            }
            if (signatures == null) {
                return out;
            }
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            for (Signature signature : signatures) {
                out.add(toColonHex(digest.digest(signature.toByteArray())));
            }
        } catch (Exception unreadable) {
            // Diagnostics only: never let a lookup failure replace the real sign-in error.
        }
        return out;
    }

    private static String toColonHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 3);
        for (int i = 0; i < bytes.length; i++) {
            if (i > 0) {
                sb.append(':');
            }
            sb.append(String.format("%02X", bytes[i]));
        }
        return sb.toString();
    }
}
