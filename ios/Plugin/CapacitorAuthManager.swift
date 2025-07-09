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
        storage.setPersistence(options.persistence)
        
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
        
        provider.signIn(options: options) { result, error in
            if let result = result {
                self.currentProvider = options.provider
                self.storage.setLastAuthProvider(options.provider)
                
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
            
            authProvider.signOut(options: options) { error in
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
            
            authProvider.signOut(options: options) { error in
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
                provider.signOut(options: options) { error in
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
        
        providerImpl.refreshToken(options: options, completion: completion)
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
        
        provider.linkAccount(options: options, completion: completion)
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
        
        completion(AuthManagerError.operationNotSupported)
    }
    
    func sendEmailVerification(options: EmailVerificationOptions?, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }
        
        completion(AuthManagerError.operationNotSupported)
    }
    
    func sendSmsCode(options: SendSmsCodeOptions, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }
        
        completion(AuthManagerError.operationNotSupported)
    }
    
    func verifySmsCode(options: VerifySmsCodeOptions, completion: @escaping (AuthResult?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }
        
        completion(nil, AuthManagerError.operationNotSupported)
    }
    
    func sendEmailCode(options: SendEmailCodeOptions, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }
        
        completion(AuthManagerError.operationNotSupported)
    }
    
    func verifyEmailCode(options: VerifyEmailCodeOptions, completion: @escaping (AuthResult?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }
        
        completion(nil, AuthManagerError.operationNotSupported)
    }
    
    func updateProfile(options: UpdateProfileOptions, completion: @escaping (AuthUser?, Error?) -> Void) {
        guard isInitialized else {
            completion(nil, AuthManagerError.notInitialized)
            return
        }
        
        completion(nil, AuthManagerError.operationNotSupported)
    }
    
    func deleteAccount(options: DeleteAccountOptions?, completion: @escaping (Error?) -> Void) {
        guard isInitialized else {
            completion(AuthManagerError.notInitialized)
            return
        }
        
        completion(AuthManagerError.operationNotSupported)
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
        storage.setCustomParameters(provider: provider, parameters: parameters)
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
        case .apple:
            return AppleAuthProvider(config: config, storage: storage, logger: logger)
        case .microsoft:
            return MicrosoftAuthProvider(config: config, storage: storage, logger: logger)
        case .facebook:
            return FacebookAuthProvider(config: config, storage: storage, logger: logger)
        default:
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