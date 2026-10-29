package com.aoneahsan.capacitor_auth_manager;

/** Result of one Android Google sign-in path: the signed-in profile, or a coded failure. */
interface GoogleProfileCallback {
    void onSuccess(GoogleResultMapper.Profile profile);

    void onError(AuthException error);
}
