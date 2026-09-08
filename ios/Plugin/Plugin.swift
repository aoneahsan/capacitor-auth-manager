import Foundation
import Capacitor

extension CAPPluginCall {
    /// Reject carrying a real `AuthErrorCode`.
    ///
    /// `BaseAuthProvider.createAuthError` already builds the code into `NSError.userInfo["code"]`
    /// and `AuthManagerError` now maps itself to one, but every rejection used to pass only
    /// `localizedDescription`. JS then fell back to substring-matching the message, so anything that
    /// did not literally contain "cancelled"/"network"/"timeout" arrived as `auth/internal-error`.
    func rejectAuth(_ error: Error, fallback: AuthErrorCode = .internalError) {
        let code: String
        if let managerError = error as? AuthManagerError {
            code = managerError.authErrorCode.rawValue
        } else if let carried = (error as NSError).userInfo["code"] as? String {
            code = carried
        } else {
            code = fallback.rawValue
        }
        self.reject(error.localizedDescription, code, error)
    }

    func rejectAuth(_ message: String, _ code: AuthErrorCode) {
        self.reject(message, code.rawValue)
    }
}

@objc(CapacitorAuthManagerPlugin)
public class CapacitorAuthManagerPlugin: CAPPlugin {
    private let implementation = CapacitorAuthManager()
    
    @objc func initialize(_ call: CAPPluginCall) {
        do {
            guard let providers = call.getArray("providers", JSObject.self) else {
                throw AuthManagerError.missingConfiguration("providers")
            }
            
            let options = AuthManagerInitOptions(
                providers: try providers.map { try AuthProviderConfig(from: $0) },
                persistence: AuthPersistence(rawValue: call.getString("persistence") ?? "local") ?? .local,
                autoRefreshToken: call.getBool("autoRefreshToken") ?? true,
                tokenRefreshBuffer: call.getInt("tokenRefreshBuffer") ?? 300000,
                enableLogging: call.getBool("enableLogging") ?? false,
                logLevel: call.getString("logLevel") ?? "info"
            )
            
            implementation.initialize(options: options) { [weak self] error in
                if let error = error {
                    call.rejectAuth(error)
                } else {
                    call.resolve()
                }
            }
        } catch {
            call.rejectAuth(error)
        }
    }
    
    @objc func signIn(_ call: CAPPluginCall) {
        do {
            guard let providerString = call.getString("provider"),
                  let provider = AuthProvider(rawValue: providerString) else {
                throw AuthManagerError.invalidProvider
            }
            
            let options = SignInOptions(
                provider: provider,
                credentials: call.getObject("credentials"),
                options: call.getObject("options")
            )
            
            implementation.signIn(options: options) { [weak self] result, error in
                if let error = error {
                    call.rejectAuth(error)
                } else if let result = result {
                    call.resolve(result.toJSObject())
                } else {
                    call.rejectAuth("Unknown error occurred", .internalError)
                }
            }
        } catch {
            call.rejectAuth(error)
        }
    }
    
    @objc func signOut(_ call: CAPPluginCall) {
        let options = SignOutOptions(
            provider: AuthProvider(rawValue: call.getString("provider") ?? ""),
            revokeToken: call.getBool("revokeToken") ?? false,
            clearCache: call.getBool("clearCache") ?? true,
            redirectUrl: call.getString("redirectUrl")
        )
        
        implementation.signOut(options: options) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func getCurrentUser(_ call: CAPPluginCall) {
        implementation.getCurrentUser { [weak self] user, error in
            if let error = error {
                call.rejectAuth(error)
            } else if let user = user {
                call.resolve(user.toJSObject())
            } else {
                call.resolve([:])
            }
        }
    }
    
    @objc func refreshToken(_ call: CAPPluginCall) {
        let options = RefreshTokenOptions(
            provider: AuthProvider(rawValue: call.getString("provider") ?? ""),
            forceRefresh: call.getBool("forceRefresh") ?? false
        )
        
        implementation.refreshToken(options: options) { [weak self] result, error in
            if let error = error {
                call.rejectAuth(error)
            } else if let result = result {
                call.resolve(result.toJSObject())
            } else {
                call.rejectAuth("Unknown error occurred", .internalError)
            }
        }
    }
    
    @objc func addAuthStateListener(_ call: CAPPluginCall) {
        let callbackId = implementation.addAuthStateListener { [weak self] user in
            self?.notifyListeners("authStateChange", data: user?.toJSObject() ?? [:])
        }
        
        call.resolve([
            "callbackId": callbackId
        ])
    }
    
    // CAPPlugin provides a built-in removeAllListeners(_:) in Capacitor 8; override it so our auth-state
    // listener registry is cleared too, then let the base clear Capacitor's listeners and resolve.
    @objc override public func removeAllListeners(_ call: CAPPluginCall) {
        implementation.removeAllListeners()
        super.removeAllListeners(call)
    }
    
    @objc func isSupported(_ call: CAPPluginCall) {
        guard let providerString = call.getString("provider"),
              let provider = AuthProvider(rawValue: providerString) else {
            call.rejectAuth("Invalid provider", .unsupportedProvider)
            return
        }
        
        implementation.isSupported(provider: provider) { [weak self] result, error in
            if let error = error {
                call.rejectAuth(error)
            } else if let result = result {
                call.resolve(result.toJSObject())
            } else {
                call.rejectAuth("Unknown error occurred", .internalError)
            }
        }
    }
    
    @objc func configure(_ call: CAPPluginCall) {
        do {
            guard let providerString = call.getString("provider"),
                  let provider = AuthProvider(rawValue: providerString),
                  let options = call.getObject("options") else {
                throw AuthManagerError.missingConfiguration("provider or options")
            }
            
            let config = try AuthProviderConfig(provider: provider, options: options)
            
            implementation.configure(config: config) { [weak self] error in
                if let error = error {
                    call.rejectAuth(error)
                } else {
                    call.resolve()
                }
            }
        } catch {
            call.rejectAuth(error)
        }
    }
    
    @objc func linkAccount(_ call: CAPPluginCall) {
        do {
            guard let providerString = call.getString("provider"),
                  let provider = AuthProvider(rawValue: providerString) else {
                throw AuthManagerError.invalidProvider
            }
            
            let options = LinkAccountOptions(
                provider: provider,
                credentials: call.getObject("credentials"),
                options: call.getObject("options")
            )
            
            implementation.linkAccount(options: options) { [weak self] result, error in
                if let error = error {
                    call.rejectAuth(error)
                } else if let result = result {
                    call.resolve(result.toJSObject())
                } else {
                    call.rejectAuth("Unknown error occurred", .internalError)
                }
            }
        } catch {
            call.rejectAuth(error)
        }
    }
    
    @objc func unlinkAccount(_ call: CAPPluginCall) {
        guard let providerString = call.getString("provider"),
              let provider = AuthProvider(rawValue: providerString) else {
            call.rejectAuth("Invalid provider", .unsupportedProvider)
            return
        }
        
        implementation.unlinkAccount(provider: provider) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func sendPasswordResetEmail(_ call: CAPPluginCall) {
        guard let email = call.getString("email") else {
            call.rejectAuth("Email is required", .emailRequired)
            return
        }
        
        let options = PasswordResetOptions(
            email: email,
            actionCodeSettings: call.getObject("actionCodeSettings")
        )
        
        implementation.sendPasswordResetEmail(options: options) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func sendEmailVerification(_ call: CAPPluginCall) {
        let options = EmailVerificationOptions(
            actionCodeSettings: call.getObject("actionCodeSettings")
        )
        
        implementation.sendEmailVerification(options: options) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func sendSmsCode(_ call: CAPPluginCall) {
        guard let phoneNumber = call.getString("phoneNumber") else {
            call.rejectAuth("Phone number is required", .phoneRequired)
            return
        }
        
        let options = SendSmsCodeOptions(
            phoneNumber: phoneNumber,
            recaptchaToken: call.getString("recaptchaToken"),
            testCode: call.getString("testCode")
        )
        
        implementation.sendSmsCode(options: options) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func verifySmsCode(_ call: CAPPluginCall) {
        guard let phoneNumber = call.getString("phoneNumber"),
              let code = call.getString("code") else {
            call.rejectAuth("Phone number and code are required", .credentialsRequired)
            return
        }
        
        let options = VerifySmsCodeOptions(
            phoneNumber: phoneNumber,
            code: code,
            verificationId: call.getString("verificationId")
        )
        
        implementation.verifySmsCode(options: options) { [weak self] result, error in
            if let error = error {
                call.rejectAuth(error)
            } else if let result = result {
                call.resolve(result.toJSObject())
            } else {
                call.rejectAuth("Unknown error occurred", .internalError)
            }
        }
    }
    
    @objc func sendEmailCode(_ call: CAPPluginCall) {
        guard let email = call.getString("email") else {
            call.rejectAuth("Email is required", .emailRequired)
            return
        }
        
        let options = SendEmailCodeOptions(
            email: email,
            recaptchaToken: call.getString("recaptchaToken"),
            testCode: call.getString("testCode")
        )
        
        implementation.sendEmailCode(options: options) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func verifyEmailCode(_ call: CAPPluginCall) {
        guard let email = call.getString("email"),
              let code = call.getString("code") else {
            call.rejectAuth("Email and code are required", .credentialsRequired)
            return
        }
        
        let options = VerifyEmailCodeOptions(
            email: email,
            code: code,
            verificationId: call.getString("verificationId")
        )
        
        implementation.verifyEmailCode(options: options) { [weak self] result, error in
            if let error = error {
                call.rejectAuth(error)
            } else if let result = result {
                call.resolve(result.toJSObject())
            } else {
                call.rejectAuth("Unknown error occurred", .internalError)
            }
        }
    }
    
    @objc func updateProfile(_ call: CAPPluginCall) {
        let options = UpdateProfileOptions(
            displayName: call.getString("displayName"),
            photoURL: call.getString("photoURL"),
            phoneNumber: call.getString("phoneNumber"),
            customClaims: call.getObject("customClaims")
        )
        
        implementation.updateProfile(options: options) { [weak self] user, error in
            if let error = error {
                call.rejectAuth(error)
            } else if let user = user {
                call.resolve(user.toJSObject())
            } else {
                call.rejectAuth("Unknown error occurred", .internalError)
            }
        }
    }
    
    @objc func deleteAccount(_ call: CAPPluginCall) {
        let options = DeleteAccountOptions(
            requireReauthentication: call.getBool("requireReauthentication") ?? false,
            provider: AuthProvider(rawValue: call.getString("provider") ?? ""),
            credentials: call.getObject("credentials")
        )
        
        implementation.deleteAccount(options: options) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func getIdToken(_ call: CAPPluginCall) {
        let options = GetIdTokenOptions(
            forceRefresh: call.getBool("forceRefresh") ?? false,
            provider: AuthProvider(rawValue: call.getString("provider") ?? "")
        )
        
        implementation.getIdToken(options: options) { [weak self] token, error in
            if let error = error {
                call.rejectAuth(error)
            } else if let token = token {
                call.resolve(["token": token])
            } else {
                call.rejectAuth("Failed to get ID token", .noAuthSession)
            }
        }
    }
    
    @objc func setCustomParameters(_ call: CAPPluginCall) {
        guard let providerString = call.getString("provider"),
              let provider = AuthProvider(rawValue: providerString),
              let parameters = call.getObject("parameters") else {
            call.rejectAuth("Provider and parameters are required", .missingConfiguration)
            return
        }
        
        implementation.setCustomParameters(provider: provider, parameters: parameters) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func revokeAccess(_ call: CAPPluginCall) {
        let options = RevokeAccessOptions(
            provider: AuthProvider(rawValue: call.getString("provider") ?? ""),
            token: call.getString("token")
        )
        
        implementation.revokeAccess(options: options) { [weak self] error in
            if let error = error {
                call.rejectAuth(error)
            } else {
                call.resolve()
            }
        }
    }
}