package com.aoneahsan.capacitor_auth_manager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CapacitorAuthManager")
public class CapacitorAuthManagerPlugin extends Plugin {

    private CapacitorAuthManager implementation;

    @Override
    public void load() {
        implementation = new CapacitorAuthManager(getContext(), getActivity());
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            JSObject options = call.getObject("options");
            if (options == null) {
                call.reject("Options are required");
                return;
            }

            implementation.initialize(options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to initialize: " + e.getMessage());
        }
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            String provider = call.getString("provider");
            JSObject credentials = call.getObject("credentials");
            JSObject options = call.getObject("options");

            if (provider == null) {
                call.reject("Provider is required");
                return;
            }

            implementation.signIn(provider, credentials, options, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Sign in failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        try {
            JSObject options = call.getObject("options");
            
            implementation.signOut(options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Sign out failed: " + e.getMessage());
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
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to get current user: " + e.getMessage());
        }
    }

    @PluginMethod
    public void refreshToken(PluginCall call) {
        try {
            JSObject options = call.getObject("options");
            
            implementation.refreshToken(options, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Token refresh failed: " + e.getMessage());
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
            call.reject("Failed to add listener: " + e.getMessage());
        }
    }

    @PluginMethod
    public void removeAllListeners(PluginCall call) {
        try {
            implementation.removeAllListeners();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to remove listeners: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        try {
            String provider = call.getString("provider");
            if (provider == null) {
                call.reject("Provider is required");
                return;
            }

            implementation.isSupported(provider, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to check support: " + e.getMessage());
        }
    }

    @PluginMethod
    public void configure(PluginCall call) {
        try {
            String provider = call.getString("provider");
            JSObject options = call.getObject("options");

            if (provider == null || options == null) {
                call.reject("Provider and options are required");
                return;
            }

            implementation.configure(provider, options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Configuration failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void linkAccount(PluginCall call) {
        try {
            String provider = call.getString("provider");
            JSObject credentials = call.getObject("credentials");
            JSObject options = call.getObject("options");

            if (provider == null) {
                call.reject("Provider is required");
                return;
            }

            implementation.linkAccount(provider, credentials, options, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Account linking failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void unlinkAccount(PluginCall call) {
        try {
            String provider = call.getString("provider");
            if (provider == null) {
                call.reject("Provider is required");
                return;
            }

            implementation.unlinkAccount(provider, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Account unlinking failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void sendPasswordResetEmail(PluginCall call) {
        try {
            String email = call.getString("email");
            JSObject actionCodeSettings = call.getObject("actionCodeSettings");

            if (email == null) {
                call.reject("Email is required");
                return;
            }

            implementation.sendPasswordResetEmail(email, actionCodeSettings, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to send password reset email: " + e.getMessage());
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
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to send email verification: " + e.getMessage());
        }
    }

    @PluginMethod
    public void sendSmsCode(PluginCall call) {
        try {
            String phoneNumber = call.getString("phoneNumber");
            String recaptchaToken = call.getString("recaptchaToken");
            String testCode = call.getString("testCode");

            if (phoneNumber == null) {
                call.reject("Phone number is required");
                return;
            }

            implementation.sendSmsCode(phoneNumber, recaptchaToken, testCode, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to send SMS code: " + e.getMessage());
        }
    }

    @PluginMethod
    public void verifySmsCode(PluginCall call) {
        try {
            String phoneNumber = call.getString("phoneNumber");
            String code = call.getString("code");
            String verificationId = call.getString("verificationId");

            if (phoneNumber == null || code == null) {
                call.reject("Phone number and code are required");
                return;
            }

            implementation.verifySmsCode(phoneNumber, code, verificationId, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("SMS verification failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void sendEmailCode(PluginCall call) {
        try {
            String email = call.getString("email");
            String recaptchaToken = call.getString("recaptchaToken");
            String testCode = call.getString("testCode");

            if (email == null) {
                call.reject("Email is required");
                return;
            }

            implementation.sendEmailCode(email, recaptchaToken, testCode, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to send email code: " + e.getMessage());
        }
    }

    @PluginMethod
    public void verifyEmailCode(PluginCall call) {
        try {
            String email = call.getString("email");
            String code = call.getString("code");
            String verificationId = call.getString("verificationId");

            if (email == null || code == null) {
                call.reject("Email and code are required");
                return;
            }

            implementation.verifyEmailCode(email, code, verificationId, result -> {
                if (result.isSuccess()) {
                    call.resolve(result.getData());
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Email verification failed: " + e.getMessage());
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
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Profile update failed: " + e.getMessage());
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
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Account deletion failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getIdToken(PluginCall call) {
        try {
            JSObject options = call.getObject("options");
            
            implementation.getIdToken(options, result -> {
                if (result.isSuccess()) {
                    JSObject ret = new JSObject();
                    ret.put("token", result.getData().getString("token"));
                    call.resolve(ret);
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to get ID token: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setCustomParameters(PluginCall call) {
        try {
            String provider = call.getString("provider");
            JSObject parameters = call.getObject("parameters");

            if (provider == null || parameters == null) {
                call.reject("Provider and parameters are required");
                return;
            }

            implementation.setCustomParameters(provider, parameters, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to set custom parameters: " + e.getMessage());
        }
    }

    @PluginMethod
    public void revokeAccess(PluginCall call) {
        try {
            JSObject options = call.getObject("options");
            
            implementation.revokeAccess(options, result -> {
                if (result.isSuccess()) {
                    call.resolve();
                } else {
                    call.reject(result.getError().getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Access revocation failed: " + e.getMessage());
        }
    }
}