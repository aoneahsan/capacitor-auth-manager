#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(CapacitorAuthManagerPlugin, "CapacitorAuthManager",
    CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(signIn, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(signOut, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getCurrentUser, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(refreshToken, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(addAuthStateListener, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(removeAllListeners, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isSupported, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(configure, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(linkAccount, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(unlinkAccount, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(sendPasswordResetEmail, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(sendEmailVerification, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(sendSmsCode, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(verifySmsCode, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(sendEmailCode, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(verifyEmailCode, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateProfile, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(deleteAccount, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getIdToken, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setCustomParameters, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(revokeAccess, CAPPluginReturnPromise);
)