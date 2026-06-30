import Foundation
import Capacitor
import FBSDKLoginKit
import FBSDKCoreKit

class FacebookAuthProvider: BaseAuthProvider {
    let provider: AuthProvider = .facebook
    let storage: AuthStorage
    let logger: AuthLogger

    private var appId: String?
    private var permissions: [String] = ["public_profile", "email"]
    private var loginManager: LoginManager
    private var currentUser: AuthUser?

    init(config: AuthProviderConfig, storage: AuthStorage, logger: AuthLogger) {
        self.storage = storage
        self.logger = logger
        self.loginManager = LoginManager()

        // Extract configuration
        if let appId = config.options["appId"] as? String {
            self.appId = appId
        }
        if let scopes = config.options["scopes"] as? [String] {
            self.permissions = scopes
        }
    }

    func initialize(completion: @escaping (Error?) -> Void) {
        logger.info("Initializing Facebook auth provider")

        // Check for existing token
        if let token = AccessToken.current, !token.isExpired {
            loadCurrentUser { [weak self] in
                self?.logger.info("Restored previous Facebook session")
                completion(nil)
            }
        } else {
            completion(nil)
        }
    }

    func signIn(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Starting Facebook sign-in")

        guard let presentingVC = UIApplication.shared.windows.first?.rootViewController else {
            completion(nil, createAuthError(code: .internalError, message: "No presenting view controller available"))
            return
        }

        loginManager.logIn(permissions: permissions, from: presentingVC) { [weak self] result, error in
            guard let self = self else { return }

            if let error = error {
                self.logger.error("Facebook sign-in failed: \(error.localizedDescription)")
                completion(nil, self.createAuthError(code: .internalError, message: error.localizedDescription))
                return
            }

            guard let result = result else {
                completion(nil, self.createAuthError(code: .internalError, message: "No result returned"))
                return
            }

            if result.isCancelled {
                completion(nil, self.createAuthError(code: .userCancelled, message: "User cancelled sign-in"))
                return
            }

            self.loadCurrentUser { [weak self] in
                guard let self = self, let user = self.currentUser else {
                    completion(nil, self?.createAuthError(code: .internalError, message: "Failed to load user data"))
                    return
                }

                guard let token = AccessToken.current else {
                    completion(nil, self.createAuthError(code: .internalError, message: "No access token"))
                    return
                }

                let credential = AuthCredential(
                    providerId: self.provider.rawValue,
                    signInMethod: "oauth",
                    accessToken: token.tokenString,
                    idToken: nil,
                    refreshToken: nil,
                    expiresAt: Int(token.expirationDate.timeIntervalSince1970) * 1000,
                    tokenType: "Bearer",
                    scope: self.permissions.joined(separator: " "),
                    rawNonce: nil
                )

                self.storage.saveCredential(credential, for: self.provider)

                let authResult = AuthResult(
                    user: user,
                    credential: credential,
                    additionalUserInfo: AdditionalUserInfo(
                        isNewUser: false,
                        providerId: self.provider.rawValue,
                        profile: nil,
                        username: nil
                    ),
                    operationType: "signIn"
                )

                self.logger.info("Facebook sign-in successful")
                completion(authResult, nil)
            }
        }
    }

    func signOut(options: JSObject?, completion: @escaping (Error?) -> Void) {
        logger.info("Signing out from Facebook")

        loginManager.logOut()
        currentUser = nil
        storage.deleteCredential(for: provider)

        completion(nil)
    }

    func getCurrentUser(completion: @escaping (AuthUser?, Error?) -> Void) {
        if let user = currentUser {
            completion(user, nil)
        } else if AccessToken.current != nil {
            loadCurrentUser { [weak self] in
                completion(self?.currentUser, nil)
            }
        } else {
            completion(nil, nil)
        }
    }

    func refreshToken(options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Refreshing Facebook token")

        AccessToken.refreshCurrentAccessToken { [weak self] connection, result, error in
            guard let self = self else { return }

            if let error = error {
                completion(nil, self.createAuthError(code: .tokenExpired, message: error.localizedDescription))
                return
            }

            guard let token = AccessToken.current else {
                completion(nil, self.createAuthError(code: .internalError, message: "No access token after refresh"))
                return
            }

            guard let user = self.currentUser else {
                completion(nil, self.createAuthError(code: .internalError, message: "No current user"))
                return
            }

            let credential = AuthCredential(
                providerId: self.provider.rawValue,
                signInMethod: "oauth",
                accessToken: token.tokenString,
                idToken: nil,
                refreshToken: nil,
                expiresAt: Int(token.expirationDate.timeIntervalSince1970) * 1000,
                tokenType: "Bearer",
                scope: self.permissions.joined(separator: " "),
                rawNonce: nil
            )

            self.storage.saveCredential(credential, for: self.provider)

            let authResult = AuthResult(
                user: user,
                credential: credential,
                additionalUserInfo: nil,
                operationType: "refresh"
            )

            completion(authResult, nil)
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
        // Facebook doesn't provide ID tokens, return access token instead
        if let token = AccessToken.current {
            if forceRefresh {
                AccessToken.refreshCurrentAccessToken { _, _, _ in
                    completion(AccessToken.current?.tokenString, nil)
                }
            } else {
                completion(token.tokenString, nil)
            }
        } else {
            completion(nil, createAuthError(code: .invalidUserToken, message: "No Facebook token found"))
        }
    }

    func revokeAccess(token: String?, completion: @escaping (Error?) -> Void) {
        logger.info("Revoking Facebook access")

        guard AccessToken.current != nil else {
            completion(nil)
            return
        }

        GraphRequest(graphPath: "/me/permissions", httpMethod: .delete).start { [weak self] _, _, error in
            guard let self = self else { return }

            if let error = error {
                self.logger.error("Failed to revoke Facebook permissions: \(error.localizedDescription)")
            }

            self.loginManager.logOut()
            self.currentUser = nil
            self.storage.deleteCredential(for: self.provider)

            completion(error)
        }
    }

    private func loadCurrentUser(completion: @escaping () -> Void) {
        let request = GraphRequest(
            graphPath: "me",
            parameters: ["fields": "id,name,email,picture.type(large)"]
        )

        request.start { [weak self] _, result, error in
            guard let self = self else {
                completion()
                return
            }

            if let error = error {
                self.logger.error("Failed to load Facebook user: \(error.localizedDescription)")
                completion()
                return
            }

            guard let data = result as? [String: Any] else {
                completion()
                return
            }

            let uid = data["id"] as? String ?? ""
            let name = data["name"] as? String
            let email = data["email"] as? String
            var photoURL: String?

            if let picture = data["picture"] as? [String: Any],
               let pictureData = picture["data"] as? [String: Any],
               let url = pictureData["url"] as? String {
                photoURL = url
            }

            self.currentUser = AuthUser(
                uid: uid,
                email: email,
                emailVerified: email != nil,
                displayName: name,
                photoURL: photoURL,
                phoneNumber: nil,
                isAnonymous: false,
                tenantId: nil,
                providerData: [
                    UserInfo(
                        providerId: self.provider.rawValue,
                        uid: uid,
                        displayName: name,
                        email: email,
                        phoneNumber: nil,
                        photoURL: photoURL
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

            completion()
        }
    }
}
