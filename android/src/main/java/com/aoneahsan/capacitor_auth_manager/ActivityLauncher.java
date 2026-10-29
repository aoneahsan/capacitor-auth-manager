package com.aoneahsan.capacitor_auth_manager;

import android.content.Intent;

/**
 * Starts an Activity for a result on behalf of a provider and hands the result back.
 *
 * <p>Implemented by {@link CapacitorAuthManagerPlugin} through Capacitor's
 * {@code startActivityForResult(call, intent, callbackName)} + {@code @ActivityCallback}, which is
 * the piece the 2.x GoogleSignIn flow lacked: it called {@code startActivityForResult} on the
 * Activity directly, the result never reached the plugin, and sign-in hung.</p>
 */
public interface ActivityLauncher {

    /** Receives the finished Activity's result code and data (data may be {@code null}). */
    interface ResultHandler {
        void onResult(int resultCode, Intent data);
    }

    /**
     * Launch {@code intent} for the plugin call currently in flight.
     *
     * @return {@code false} when no plugin call is in flight to attach the result to.
     */
    boolean launch(Intent intent, ResultHandler handler);
}
