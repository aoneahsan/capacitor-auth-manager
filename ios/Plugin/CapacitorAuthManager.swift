import Foundation
import Capacitor

@objc public class CapacitorAuthManager: NSObject {
    private var providers: [AuthProvider: BaseAuthProvider] = [:]
    private var storage: AuthStorage
    private var logger: AuthLogger
    private var authStateListeners: [String: AuthStateChangeCallback] = [:]
    private var currentProvider: AuthProvider?
    private var isInitialized = false
    
    override init() {
        self.storage = AuthStorage()
        self.logger = AuthLogger()
        super.init()
    }
    
    func initialize(options: AuthManagerInitOptions, completion: @escaping (Error?) -> Void) {
        guard !isInitialized else {
            logger.warn("Auth manager already initialized")
            completion(nil)
            return
        }
        
        // Configure logger
        logger.setEnabled(options.enableLogging)
        logger.setLogLevel(options.logLevel)
        
        // Configure storage persistence
        storage.setPersistence(options.persistence.rawValue)
        
        // Initialize providers
        let group = DispatchGroup()
        var initError: Error?
        
        for config in options.providers {
            group.enter()
            
            do {
                let provider = try createProvider(config: config)
                provider.initialize { error in
                    if let error = error {
                        initError = error
                    } else {
                        self.providers[config.provider] = provider
                    }
                    group.leave()
                }
            } catch {
                initError = error
                group.leave()
            }
        }
        
        group.notify(queue: .main) {
            if let error = initError {
                completion(error)
            } else {
                self.isInitialized = true
                completion(nil)
            }
        }
    }
    
    func signIn(options: SignInOptions, completion: @escaping (AuthResult?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }
        
        guard let provider = providers[options.provider] else {
            completion(nil, AuthManagerError.providerNotConfigured(options.provider))
            return
        }
        
        provider.signIn(credentials: options.credentials, options: options.options) { result, error in
            if let result = result {
                self.currentProvider = options.provider
                self.storage.setLastAuthProvider(options.provider.rawValue)
                
                // Notify listeners
                self.notifyAuthStateChange(result.user)
            }
            completion(result, error)
        }
    }
    
    func signOut(options: SignOutOptions?, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }
        
        if let provider = options?.provider {
            // Sign out from specific provider
            guard let authProvider = providers[provider] else {
                completion(AuthManagerError.providerNotConfigured(provider))
                return
            }
            
            authProvider.signOut(options: nil) { error in
                if error == nil {
                    self.notifyAuthStateChange(nil)
                }
                completion(error)
            }
        } else if let currentProvider = currentProvider {
            // Sign out from current provider
            guard let authProvider = providers[currentProvider] else {
                completion(AuthManagerError.providerNotConfigured(currentProvider))
                return
            }
            
            authProvider.signOut(options: nil) { error in
                if error == nil {
                    self.currentProvider = nil
                    self.storage.removeLastAuthProvider()
                    self.notifyAuthStateChange(nil)
                }
                completion(error)
            }
        } else {
            // Sign out from all providers
            let group = DispatchGroup()
            var signOutError: Error?
            
            for (_, provider) in providers {
                group.enter()
                provider.signOut(options: nil) { error in
                    if let error = error {
                        signOutError = error
                    }
                    group.leave()
                }
            }
            
            group.notify(queue: .main) {
                self.currentProvider = nil
                self.storage.removeLastAuthProvider()
                self.notifyAuthStateChange(nil)
                completion(signOutError)
            }
        }
    }
    
    func getCurrentUser(completion: @escaping (AuthUser?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }
        
        if let currentProvider = currentProvider,
           let provider = providers[currentProvider] {
            provider.getCurrentUser(completion: completion)
        } else {
            // Try to get user from any provider
            for (_, provider) in providers {
                provider.getCurrentUser { user, error in
                    if let user = user {
                        completion(user, nil)
                        return
                    }
                }
            }
            completion(nil, nil)
        }
    }
    
    func refreshToken(options: RefreshTokenOptions?, completion: @escaping (AuthResult?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }
        
        let provider = options?.provider ?? currentProvider
        guard let authProvider = provider, let providerImpl = providers[authProvider] else {
            completion(nil, AuthManagerError.noProviderSpecified)
            return
        }
        
        providerImpl.refreshToken(options: nil, completion: completion)
    }
    
    func addAuthStateListener(_ callback: @escaping AuthStateChangeCallback) -> String {
        let callbackId = UUID().uuidString
        authStateListeners[callbackId] = callback
        
        // Emit current state
        getCurrentUser { user, _ in
            callback(user)
        }
        
        return callbackId
    }
    
    func removeAuthStateListener(callbackId: String) {
        authStateListeners.removeValue(forKey: callbackId)
    }
    
    func removeAllListeners() {
        authStateListeners.removeAll()
    }
    
    func isSupported(provider: AuthProvider, completion: @escaping (IsSupportedResult?, Error?) -> Void) {
        let availableProviders = Array(providers.keys)
        
        if let authProvider = providers[provider] {
            authProvider.isSupported { isSupported, error in
                let result = IsSupportedResult(
                    isSupported: isSupported,
                    reason: isSupported ? nil : "Provider not supported on this platform",
                    availableProviders: availableProviders
                )
                completion(result, error)
            }
        } else {
            let result = IsSupportedResult(
                isSupported: false,
                reason: "Provider not configured",
                availableProviders: availableProviders
            )
            completion(result, nil)
        }
    }
    
    func configure(config: AuthProviderConfig, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }
        
        do {
            let provider = try createProvider(config: config)
            provider.initialize { error in
                if error == nil {
                    self.providers[config.provider] = provider
                }
                completion(error)
            }
        } catch {
            completion(error)
        }
    }
    
    func linkAccount(options: LinkAccountOptions, completion: @escaping (AuthResult?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }
        
        guard let provider = providers[options.provider] else {
            completion(nil, AuthManagerError.providerNotConfigured(options.provider))
            return
        }
        
        provider.linkAccount(credentials: options.credentials, options: options.options, completion: completion)
    }
    
    func unlinkAccount(provider: AuthProvider, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }
        
        guard let authProvider = providers[provider] else {
            completion(AuthManagerError.providerNotConfigured(provider))
            return
        }
        
        authProvider.unlinkAccount(completion: completion)
    }
    
    func sendPasswordResetEmail(options: PasswordResetOptions, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }

        // Password reset is not supported on iOS native - requires web-based email/password provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        completion(AuthManagerError.operationNotSupportedOnPlatform("sendPasswordResetEmail", "iOS"))
    }

    func sendEmailVerification(options: EmailVerificationOptions?, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }

        // Email verification is not supported on iOS native - requires web-based email/password provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        completion(AuthManagerError.operationNotSupportedOnPlatform("sendEmailVerification", "iOS"))
    }

    func sendSmsCode(options: SendSmsCodeOptions, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }

        // SMS code is not supported on iOS native - requires web-based SMS provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        completion(AuthManagerError.operationNotSupportedOnPlatform("sendSmsCode", "iOS"))
    }

    func verifySmsCode(options: VerifySmsCodeOptions, completion: @escaping (AuthResult?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }

        // SMS verification is not supported on iOS native - requires web-based SMS provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        completion(nil, AuthManagerError.operationNotSupportedOnPlatform("verifySmsCode", "iOS"))
    }

    func sendEmailCode(options: SendEmailCodeOptions, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }

        // Email code is not supported on iOS native - requires web-based email-code provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        completion(AuthManagerError.operationNotSupportedOnPlatform("sendEmailCode", "iOS"))
    }

    func verifyEmailCode(options: VerifyEmailCodeOptions, completion: @escaping (AuthResult?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }

        // Email code verification is not supported on iOS native - requires web-based email-code provider
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        completion(nil, AuthManagerError.operationNotSupportedOnPlatform("verifyEmailCode", "iOS"))
    }

    func updateProfile(options: UpdateProfileOptions, completion: @escaping (AuthUser?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }

        // Profile updates are not supported on iOS native - OAuth providers manage profiles externally
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        completion(nil, AuthManagerError.operationNotSupportedOnPlatform("updateProfile", "iOS"))
    }

    func deleteAccount(options: DeleteAccountOptions?, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }

        // Account deletion is not supported on iOS native - OAuth providers manage accounts externally
        // See docs/api-reference/CAPABILITY_MATRIX.md for platform support details
        completion(AuthManagerError.operationNotSupportedOnPlatform("deleteAccount", "iOS"))
    }
    
    func getIdToken(options: GetIdTokenOptions?, completion: @escaping (String?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }
        
        let provider = options?.provider ?? currentProvider
        guard let authProvider = provider, let providerImpl = providers[authProvider] else {
            completion(nil, AuthManagerError.noProviderSpecified)
            return
        }
        
        providerImpl.getIdToken(forceRefresh: options?.forceRefresh ?? false, completion: completion)
    }
    
    func setCustomParameters(provider: AuthProvider, parameters: JSObject, completion: @escaping (Error?) -> Void) {
        storage.setCustomParameters(provider: provider.rawValue, parameters: parameters)
        completion(nil)
    }
    
    func revokeAccess(options: RevokeAccessOptions?, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }
        
        let provider = options?.provider ?? currentProvider
        guard let authProvider = provider, let providerImpl = providers[authProvider] else {
            completion(AuthManagerError.noProviderSpecified)
            return
        }
        
        providerImpl.revokeAccess(token: options?.token, completion: completion)
    }
    
    // MARK: - Private Methods
    
    private func createProvider(config: AuthProviderConfig) throws -> BaseAuthProvider {
        switch config.provider {
        case .google:
            return GoogleAuthProvider(config: config, storage: storage, logger: logger)
        default:
            // Google-first build (2.4.x): non-Google native providers are disabled. Their Swift lives in
            // ios/disabled-native-providers/ (not compiled, not shipped) so this pod no longer depends on
            // the Facebook SDK / MSAL. The JS layer reports PROVIDER_NOT_ENABLED before reaching native.
            throw AuthManagerError.providerNotImplemented(config.provider)
        }
    }
    
    private func notifyAuthStateChange(_ user: AuthUser?) {
        for (_, listener) in authStateListeners {
            listener(user)
        }
    }
}

// MARK: - Type Aliases

typealias AuthStateChangeCallback = (AuthUser?) -> Void