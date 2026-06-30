import Foundation
import Capacitor
import MSAL

class MicrosoftAuthProvider: BaseAuthProvider {
    let provider: AuthProvider = .microsoft
    let storage: AuthStorage
    let logger: AuthLogger

    private var clientId: String?
    private var authority: String?
    private var redirectUri: String?
    private var scopes: [String] = ["openid", "profile", "email"]
    private var msalApplication: MSALPublicClientApplication?
    private var currentUser: AuthUser?

    init(config: AuthProviderConfig, storage: AuthStorage, logger: AuthLogger) {
        self.storage = storage
        self.logger = logger

        // Extract configuration
        if let clientId = config.options["clientId"] as? String {
            self.clientId = clientId
        }
        if let authority = config.options["authority"] as? String {
            self.authority = authority
        }
        if let redirectUri = config.options["redirectUri"] as? String {
            self.redirectUri = redirectUri
        }
        if let scopes = config.options["scopes"] as? [String] {
            self.scopes = scopes
        }
    }

    func initialize(completion: @escaping (Error?) -> Void) {
        logger.info("Initializing Microsoft auth provider")

        guard let clientId = clientId else {
            completion(createAuthError(code: .missingConfiguration, message: "Microsoft client ID is required"))
            return
        }

        do {
            let authorityURL: URL
            if let authority = authority, let url = URL(string: authority) {
                authorityURL = url
            } else {
                authorityURL = URL(string: "https://login.microsoftonline.com/common")!
            }

            let msalAuthority = try MSALAADAuthority(url: authorityURL)

            let config = MSALPublicClientApplicationConfig(
                clientId: clientId,
                redirectUri: redirectUri,
                authority: msalAuthority
            )

            msalApplication = try MSALPublicClientApplication(configuration: config)

            // Check for existing account
            if let accounts = try? msalApplication?.allAccounts(), let account = accounts.first {
                loadUser(from: account)
            }

            completion(nil)
        } catch {
            logger.error("Failed to initialize MSAL: \(error.localizedDescription)")
            completion(createAuthError(code: .internalError, message: error.localizedDescription))
        }
    }

    func signIn(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Starting Microsoft sign-in")

        guard let application = msalApplication else {
            completion(nil, createAuthError(code: .missingConfiguration, message: "MSAL not initialized"))
            return
        }

        guard let presentingVC = UIApplication.shared.windows.first?.rootViewController else {
            completion(nil, createAuthError(code: .internalError, message: "No presenting view controller available"))
            return
        }

        let webViewParameters = MSALWebviewParameters(authPresentationViewController: presentingVC)
        let interactiveParameters = MSALInteractiveTokenParameters(scopes: scopes, webviewParameters: webViewParameters)

        application.acquireToken(with: interactiveParameters) { [weak self] result, error in
            guard let self = self else { return }

            if let error = error {
                self.logger.error("Microsoft sign-in failed: \(error.localizedDescription)")
                if let nsError = error as NSError?, nsError.domain == MSALErrorDomain {
                    if nsError.code == MSALError.userCanceled.rawValue {
                        completion(nil, self.createAuthError(code: .userCancelled, message: "User cancelled sign-in"))
                        return
                    }
                }
                completion(nil, self.createAuthError(code: .internalError, message: error.localizedDescription))
                return
            }

            guard let result = result else {
                completion(nil, self.createAuthError(code: .internalError, message: "No result returned"))
                return
            }

            let authResult = self.createAuthResult(from: result)
            self.logger.info("Microsoft sign-in successful")
            completion(authResult, nil)
        }
    }

    func signOut(options: JSObject?, completion: @escaping (Error?) -> Void) {
        logger.info("Signing out from Microsoft")

        guard let application = msalApplication else {
            completion(nil)
            return
        }

        do {
            let accounts = try application.allAccounts()
            for account in accounts {
                try application.remove(account)
            }
            currentUser = nil
            storage.deleteCredential(for: provider)
            completion(nil)
        } catch {
            completion(error)
        }
    }

    func getCurrentUser(completion: @escaping (AuthUser?, Error?) -> Void) {
        completion(currentUser, nil)
    }

    func refreshToken(options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Refreshing Microsoft token")

        guard let application = msalApplication else {
            completion(nil, createAuthError(code: .missingConfiguration, message: "MSAL not initialized"))
            return
        }

        do {
            let accounts = try application.allAccounts()
            guard let account = accounts.first else {
                completion(nil, createAuthError(code: .invalidUserToken, message: "No account found"))
                return
            }

            let silentParameters = MSALSilentTokenParameters(scopes: scopes, account: account)
            silentParameters.forceRefresh = true

            application.acquireTokenSilent(with: silentParameters) { [weak self] result, error in
                guard let self = self else { return }

                if let error = error {
                    // If silent refresh fails, try interactive
                    self.signIn(credentials: nil, options: nil, completion: completion)
                    return
                }

                guard let result = result else {
                    completion(nil, self.createAuthError(code: .internalError, message: "No result returned"))
                    return
                }

                let authResult = self.createAuthResult(from: result)
                completion(authResult, nil)
            }
        } catch {
            completion(nil, createAuthError(code: .internalError, message: error.localizedDescription))
        }
    }

    func isSupported(completion: @escaping (Bool, Error?) -> Void) {
        completion(true, nil)
    }

    func linkAccount(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        signIn(credentials: credentials, options: options, completion: completion)
    }

    func unlinkAccount(completion: @escaping (Error?) -> Void) {
        signOut(options: nil, completion: completion)
    }

    func getIdToken(forceRefresh: Bool, completion: @escaping (String?, Error?) -> Void) {
        guard let application = msalApplication else {
            completion(nil, createAuthError(code: .missingConfiguration, message: "MSAL not initialized"))
            return
        }

        do {
            let accounts = try application.allAccounts()
            guard let account = accounts.first else {
                completion(nil, createAuthError(code: .invalidUserToken, message: "No account found"))
                return
            }

            let silentParameters = MSALSilentTokenParameters(scopes: scopes, account: account)
            silentParameters.forceRefresh = forceRefresh

            application.acquireTokenSilent(with: silentParameters) { result, error in
                if let error = error {
                    completion(nil, error)
                } else {
                    completion(result?.idToken, nil)
                }
            }
        } catch {
            completion(nil, error)
        }
    }

    func revokeAccess(token: String?, completion: @escaping (Error?) -> Void) {
        // Microsoft requires web-based sign out to fully revoke
        signOut(options: nil, completion: completion)
    }

    private func loadUser(from account: MSALAccount) {
        currentUser = AuthUser(
            uid: account.homeAccountId?.identifier ?? account.username ?? "",
            email: account.username,
            emailVerified: account.username?.contains("@") ?? false,
            displayName: account.username,
            photoURL: nil,
            phoneNumber: nil,
            isAnonymous: false,
            tenantId: account.homeAccountId?.tenantId,
            providerData: [
                UserInfo(
                    providerId: provider.rawValue,
                    uid: account.homeAccountId?.identifier ?? "",
                    displayName: account.username,
                    email: account.username,
                    phoneNumber: nil,
                    photoURL: nil
                )
            ],
            metadata: UserMetadata(
                creationTime: nil,
                lastSignInTime: ISO8601DateFormatter().string(from: Date()),
                lastRefreshTime: nil
            ),
            refreshToken: nil,
            customClaims: nil
        )
    }

    private func createAuthResult(from msalResult: MSALResult) -> AuthResult {
        let account = msalResult.account

        let authUser = AuthUser(
            uid: account.homeAccountId?.identifier ?? account.username ?? "",
            email: account.username,
            emailVerified: account.username?.contains("@") ?? false,
            displayName: account.username,
            photoURL: nil,
            phoneNumber: nil,
            isAnonymous: false,
            tenantId: account.homeAccountId?.tenantId,
            providerData: [
                UserInfo(
                    providerId: provider.rawValue,
                    uid: account.homeAccountId?.identifier ?? "",
                    displayName: account.username,
                    email: account.username,
                    phoneNumber: nil,
                    photoURL: nil
                )
            ],
            metadata: UserMetadata(
                creationTime: nil,
                lastSignInTime: ISO8601DateFormatter().string(from: Date()),
                lastRefreshTime: nil
            ),
            refreshToken: nil,
            customClaims: nil
        )

        currentUser = authUser

        let credential = AuthCredential(
            providerId: provider.rawValue,
            signInMethod: "oauth",
            accessToken: msalResult.accessToken,
            idToken: msalResult.idToken,
            refreshToken: nil,
            expiresAt: Int(msalResult.expiresOn?.timeIntervalSince1970 ?? 0) * 1000,
            tokenType: "Bearer",
            scope: msalResult.scopes.joined(separator: " "),
            rawNonce: nil
        )

        storage.saveCredential(credential, for: provider)

        return AuthResult(
            user: authUser,
            credential: credential,
            additionalUserInfo: AdditionalUserInfo(
                isNewUser: false,
                providerId: provider.rawValue,
                profile: nil,
                username: account.username
            ),
            operationType: "signIn"
        )
    }
}
