package com.aoneahsan.capacitor_auth_manager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CapacitorAuthManager")
public class CapacitorAuthManagerPlugin extends Plugin {

    private CapacitorAuthManager implementation;

    /**
     * Reject a call with the {@link AuthErrorCodes} value the failure carries, so JS receives a real
     * {@code AuthError.code} instead of one guessed from the message text. A plain exception (nothing
     * below it set a code) falls back to {@code fallbackCode}.
     */
    private static void rejectWith(PluginCall call, Exception error, String fallbackCode) {
        if (error == null) {
            call.reject("Unknown error", AuthErrorCodes.INTERNAL_ERROR);
            return;
        }
        String message = error.getMessage() != null ? error.getMessage() : error.toString();
        call.reject(message, AuthException.codeOf(error, fallbackCode));
    }

    private static void rejectWith(PluginCall call, Exception error) {
        rejectWith(call, error, AuthErrorCodes.INTERNAL_ERROR);
    }

    @Override
    public void load() {
        implementation = new CapacitorAuthManager(getContext(), getActivity());
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            // The JS bridge passes the init config at the top level
            // ({ providers: [...], persistence, enableLogging, ... }), not nested under an "options"
            // key. Accept either shape for backward compatibility.
            JSObject options = call.getObject("options");
            if (options == null) {
                options = call.getData();
            }
            if (options == null) {
                call.reject("Options are required", AuthErrorCodes.MISSING_CONFIGURATION);
                return;
            }

            implementation.initialize(options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to initialize: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.PROVIDER_INIT_FAILED));
        }
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            String provider = call.getString("provider");
            JSObject credentials = call.getObject("credentials");
            JSObject options = call.getObject("options");

            if (provider == null) {
                call.reject("Provider is required", AuthErrorCodes.MISSING_CONFIGURATION);
                return;
            }

            implementation.signIn(provider, credentials, options, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Sign in failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.SIGN_IN_FAILED));
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        try {
            // JS passes { provider } at the top level; fall back to the call data so the provider
            // name reaches the orchestrator (it reads options.provider).
            JSObject options = call.getObject("options");
            if (options == null) {
                options = call.getData();
            }

            implementation.signOut(options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Sign out failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.SIGN_OUT_FAILED));
        }
    }

    @PluginMethod
    public void getCurrentUser(PluginCall call) {
        try {
            implementation.getCurrentUser(result -> {
                if (result.isSuccess()) {
                    JSObject user = result.getData();
                    if (user != null) {
                        call.resolve(user);
                    } else {
                        call.resolve(new JSObject());
                    }
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to get current user: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.INTERNAL_ERROR));
        }
    }

    @PluginMethod
    public void refreshToken(PluginCall call) {
        try {
            // JS passes { provider } at the top level; fall back to the call data so the provider
            // name reaches the orchestrator (it reads options.provider).
            JSObject options = call.getObject("options");
            if (options == null) {
                options = call.getData();
            }

            implementation.refreshToken(options, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Token refresh failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.TOKEN_REFRESH_FAILED));
        }
    }

    @PluginMethod
    public void addAuthStateListener(PluginCall call) {
        try {
            String callbackId = implementation.addAuthStateListener(user -> {
                JSObject ret = new JSObject();
                if (user != null) {
                    ret.put("user", user);
                } else {
                    ret.put("user", JSObject.NULL);
                }
                notifyListeners("authStateChange", ret);
            });

            JSObject ret = new JSObject();
            ret.put("callbackId", callbackId);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to add listener: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.INTERNAL_ERROR));
        }
    }

    @PluginMethod
    public void removeAllListeners(PluginCall call) {
        try {
            implementation.removeAllListeners();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to remove listeners: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.INTERNAL_ERROR));
        }
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        try {
            String provider = call.getString("provider");
            if (provider == null) {
                call.reject("Provider is required", AuthErrorCodes.MISSING_CONFIGURATION);
                return;
            }

            implementation.isSupported(provider, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to check support: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.INTERNAL_ERROR));
        }
    }

    @PluginMethod
    public void configure(PluginCall call) {
        try {
            String provider = call.getString("provider");
            JSObject options = call.getObject("options");

            if (provider == null || options == null) {
                call.reject("Provider and options are required", AuthErrorCodes.MISSING_CONFIGURATION);
                return;
            }

            implementation.configure(provider, options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Configuration failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.MISSING_CONFIGURATION));
        }
    }

    @PluginMethod
    public void linkAccount(PluginCall call) {
        try {
            String provider = call.getString("provider");
            JSObject credentials = call.getObject("credentials");
            JSObject options = call.getObject("options");

            if (provider == null) {
                call.reject("Provider is required", AuthErrorCodes.MISSING_CONFIGURATION);
                return;
            }

            implementation.linkAccount(provider, credentials, options, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Account linking failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void unlinkAccount(PluginCall call) {
        try {
            String provider = call.getString("provider");
            if (provider == null) {
                call.reject("Provider is required", AuthErrorCodes.MISSING_CONFIGURATION);
                return;
            }

            implementation.unlinkAccount(provider, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Account unlinking failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void sendPasswordResetEmail(PluginCall call) {
        try {
            String email = call.getString("email");
            JSObject actionCodeSettings = call.getObject("actionCodeSettings");

            if (email == null) {
                call.reject("Email is required", AuthErrorCodes.EMAIL_REQUIRED);
                return;
            }

            implementation.sendPasswordResetEmail(email, actionCodeSettings, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to send password reset email: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void sendEmailVerification(PluginCall call) {
        try {
            JSObject options = call.getObject("options");
            
            implementation.sendEmailVerification(options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to send email verification: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void sendSmsCode(PluginCall call) {
        try {
            String phoneNumber = call.getString("phoneNumber");
            String recaptchaToken = call.getString("recaptchaToken");
            String testCode = call.getString("testCode");

            if (phoneNumber == null) {
                call.reject("Phone number is required", AuthErrorCodes.PHONE_REQUIRED);
                return;
            }

            implementation.sendSmsCode(phoneNumber, recaptchaToken, testCode, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to send SMS code: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void verifySmsCode(PluginCall call) {
        try {
            String phoneNumber = call.getString("phoneNumber");
            String code = call.getString("code");
            String verificationId = call.getString("verificationId");

            if (phoneNumber == null || code == null) {
                call.reject("Phone number and code are required", AuthErrorCodes.CREDENTIALS_REQUIRED);
                return;
            }

            implementation.verifySmsCode(phoneNumber, code, verificationId, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("SMS verification failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void sendEmailCode(PluginCall call) {
        try {
            String email = call.getString("email");
            String recaptchaToken = call.getString("recaptchaToken");
            String testCode = call.getString("testCode");

            if (email == null) {
                call.reject("Email is required", AuthErrorCodes.EMAIL_REQUIRED);
                return;
            }

            implementation.sendEmailCode(email, recaptchaToken, testCode, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to send email code: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void verifyEmailCode(PluginCall call) {
        try {
            String email = call.getString("email");
            String code = call.getString("code");
            String verificationId = call.getString("verificationId");

            if (email == null || code == null) {
                call.reject("Email and code are required", AuthErrorCodes.CREDENTIALS_REQUIRED);
                return;
            }

            implementation.verifyEmailCode(email, code, verificationId, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Email verification failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void updateProfile(PluginCall call) {
        try {
            JSObject options = call.getObject("options");
            if (options == null) {
                options = new JSObject();
            }

            implementation.updateProfile(options, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Profile update failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void deleteAccount(PluginCall call) {
        try {
            JSObject options = call.getObject("options");
            
            implementation.deleteAccount(options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Account deletion failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }

    @PluginMethod
    public void getIdToken(PluginCall call) {
        try {
            // JS passes { provider, forceRefresh } at the top level; fall back to the call data so
            // both reach the orchestrator (it reads options.provider / options.forceRefresh).
            JSObject options = call.getObject("options");
            if (options == null) {
                options = call.getData();
            }
            
            implementation.getIdToken(options, result -> {
                if (result.isSuccess()) {
                    JSObject ret = new JSObject();
                    ret.put("token", result.getData().getString("token"));
                    call.resolve(ret);
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to get ID token: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.INTERNAL_ERROR));
        }
    }

    @PluginMethod
    public void setCustomParameters(PluginCall call) {
        try {
            String provider = call.getString("provider");
            JSObject parameters = call.getObject("parameters");

            if (provider == null || parameters == null) {
                call.reject("Provider and parameters are required", AuthErrorCodes.MISSING_CONFIGURATION);
                return;
            }

            implementation.setCustomParameters(provider, parameters, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to set custom parameters: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.INTERNAL_ERROR));
        }
    }

    @PluginMethod
    public void revokeAccess(PluginCall call) {
        try {
            // JS passes { provider } at the top level; fall back to the call data so the provider
            // name reaches the orchestrator (it reads options.provider).
            JSObject options = call.getObject("options");
            if (options == null) {
                options = call.getData();
            }

            implementation.revokeAccess(options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    rejectWith(call, result.getError());
                }
            });
        } catch (Exception e) {
            call.reject("Access revocation failed: " + e.getMessage(), AuthException.codeOf(e, AuthErrorCodes.OPERATION_NOT_ALLOWED));
        }
    }
}