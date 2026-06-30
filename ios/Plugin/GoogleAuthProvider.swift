import Foundation
import UIKit
import Capacitor
import GoogleSignIn

/// Native Google sign-in provider.
///
/// Google-first / Firebase-agnostic: this returns a credential
/// `{ idToken, accessToken, serverAuthCode?, ... }` to JS. The app is responsible
/// for any downstream Firebase `signInWithCredential` — this plugin never touches Firebase.
class GoogleAuthProvider: BaseAuthProvider {
    let provider: AuthProvider = .google
    let storage: AuthStorage
    let logger: AuthLogger

    /// The literal provider id JS expects for Google credentials / provider data.
    /// (The internal `AuthProvider.google.rawValue` is `"google"`, used only for storage keys.)
    private let providerIdString = "google.com"

    // Configuration (from `initialize` providers[].options — GoogleAuthOptions)
    private var clientId: String?
    private var iosClientId: String?
    private var serverClientId: String?
    private var hostedDomain: String?
    private var loginHint: String?
    private var offlineAccess: Bool = false
    private var scopes: [String] = []

    private var currentUser: AuthUser?

    init(config: AuthProviderConfig, storage: AuthStorage, logger: AuthLogger) {
        self.storage = storage
        self.logger = logger

        // Extract configuration
        if let value = config.options["clientId"] as? String { self.clientId = value }
        if let value = config.options["iosClientId"] as? String { self.iosClientId = value }
        if let value = config.options["serverClientId"] as? String { self.serverClientId = value }
        if let value = config.options["hostedDomain"] as? String { self.hostedDomain = value }
        if let value = config.options["loginHint"] as? String { self.loginHint = value }
        if let value = config.options["offlineAccess"] as? Bool { self.offlineAccess = value }
        if let value = config.options["scopes"] as? [String] { self.scopes = value }
    }

    func initialize(completion: @escaping (Error?) -> Void) {
        logger.info("Initializing Google auth provider")

        // A client id must be resolvable from options or the app's Info.plist (`GIDClientID`).
        guard resolveClientId() != nil else {
            completion(createAuthError(
                code: .missingConfiguration,
                message: "Google client ID is required. Provide `clientId`/`iosClientId` in the provider options, or set `GIDClientID` in Info.plist."
            ))
            return
        }

        // Restore any existing session so getCurrentUser works after a cold start.
        if GIDSignIn.sharedInstance.hasPreviousSignIn() {
            GIDSignIn.sharedInstance.restorePreviousSignIn { [weak self] user, error in
                if let user = user {
                    self?.currentUser = self?.createAuthUser(from: user)
                    self?.logger.info("Restored previous Google sign-in")
                }
                completion(error)
            }
        } else {
            completion(nil)
        }
    }

    func signIn(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Starting Google sign-in")

        guard let configuration = makeConfiguration() else {
            completion(nil, createAuthError(
                code: .missingConfiguration,
                message: "Google client ID is required. Provide `clientId`/`iosClientId` in the provider options, or set `GIDClientID` in Info.plist."
            ))
            return
        }

        // Presentation + GoogleSignIn must run on the main thread.
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            guard let presentingVC = self.topPresentingViewController() else {
                completion(nil, self.createAuthError(code: .internalError, message: "No presenting view controller available"))
                return
            }

            // Setting `serverClientID` on the configuration is what makes `serverAuthCode`
            // available in the result (offline access).
            GIDSignIn.sharedInstance.configuration = configuration

            let additionalScopes = self.scopes.isEmpty ? nil : self.scopes

            GIDSignIn.sharedInstance.signIn(
                withPresenting: presentingVC,
                hint: self.loginHint,
                additionalScopes: additionalScopes
            ) { [weak self] result, error in
                guard let self = self else { return }

                if let error = error {
                    self.logger.error("Google sign-in failed: \(error.localizedDescription)")
                    if (error as NSError).code == GIDSignInError.canceled.rawValue {
                        completion(nil, self.createAuthError(code: .userCancelled, message: "User cancelled sign-in"))
                    } else {
                        completion(nil, self.createAuthError(code: .internalError, message: error.localizedDescription))
                    }
                    return
                }

                guard let result = result else {
                    completion(nil, self.createAuthError(code: .internalError, message: "No user data returned"))
                    return
                }

                let gidUser = result.user
                let authUser = self.createAuthUser(from: gidUser)
                self.currentUser = authUser

                // serverAuthCode lives on the GIDSignInResult (not on the user) and is only
                // present when a serverClientID is configured.
                let credential = self.makeCredential(from: gidUser, serverAuthCode: result.serverAuthCode)

                // Persist credential for later restore (serverAuthCode is single-use and not persisted).
                self.storage.saveCredential(credential, for: self.provider)

                let authResult = AuthResult(
                    user: authUser,
                    credential: credential,
                    additionalUserInfo: AdditionalUserInfo(
                        isNewUser: false,
                        providerId: self.providerIdString,
                        profile: nil,
                        username: nil
                    ),
                    operationType: "signIn"
                )

                self.logger.info("Google sign-in successful")
                completion(authResult, nil)
            }
        }
    }

    func signOut(options: JSObject?, completion: @escaping (Error?) -> Void) {
        logger.info("Signing out from Google")

        GIDSignIn.sharedInstance.signOut()
        currentUser = nil
        storage.deleteCredential(for: provider)

        completion(nil)
    }

    func getCurrentUser(completion: @escaping (AuthUser?, Error?) -> Void) {
        if let user = currentUser {
            completion(user, nil)
        } else if let gidUser = GIDSignIn.sharedInstance.currentUser {
            currentUser = createAuthUser(from: gidUser)
            completion(currentUser, nil)
        } else {
            completion(nil, nil)
        }
    }

    func refreshToken(options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Refreshing Google token")

        if let user = GIDSignIn.sharedInstance.currentUser {
            refreshAndBuildResult(user: user, completion: completion)
        } else if GIDSignIn.sharedInstance.hasPreviousSignIn() {
            // No in-memory user yet (e.g. cold start) — restore first, then refresh.
            GIDSignIn.sharedInstance.restorePreviousSignIn { [weak self] user, error in
                guard let self = self else { return }
                if let error = error {
                    completion(nil, self.createAuthError(code: .tokenExpired, message: error.localizedDescription))
                    return
                }
                guard let user = user else {
                    completion(nil, self.createAuthError(code: .invalidUserToken, message: "No current user"))
                    return
                }
                self.refreshAndBuildResult(user: user, completion: completion)
            }
        } else {
            completion(nil, createAuthError(code: .invalidUserToken, message: "No current user"))
        }
    }

    func isSupported(completion: @escaping (Bool, Error?) -> Void) {
        // Google Sign-In is available on all iOS versions we support.
        completion(true, nil)
    }

    func linkAccount(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        // For Google, linking is the same interactive flow as sign-in.
        signIn(credentials: credentials, options: options, completion: completion)
    }

    func unlinkAccount(completion: @escaping (Error?) -> Void) {
        signOut(options: nil, completion: completion)
    }

    func getIdToken(forceRefresh: Bool, completion: @escaping (String?, Error?) -> Void) {
        guard let user = GIDSignIn.sharedInstance.currentUser else {
            completion(nil, createAuthError(code: .invalidUserToken, message: "No current user"))
            return
        }

        if forceRefresh {
            user.refreshTokensIfNeeded { user, error in
                if let error = error {
                    completion(nil, error)
                } else {
                    completion(user?.idToken?.tokenString, nil)
                }
            }
        } else {
            completion(user.idToken?.tokenString, nil)
        }
    }

    func revokeAccess(token: String?, completion: @escaping (Error?) -> Void) {
        logger.info("Revoking Google access")

        GIDSignIn.sharedInstance.disconnect { [weak self] error in
            guard let self = self else { return }
            if let error = error {
                completion(error)
            } else {
                self.currentUser = nil
                self.storage.deleteCredential(for: self.provider)
                completion(nil)
            }
        }
    }

    // MARK: - Private helpers

    /// Resolve the iOS OAuth client id: explicit `iosClientId`, else `clientId`, else the
    /// app's `GIDClientID` from Info.plist. Returns nil when none is available.
    private func resolveClientId() -> String? {
        if let iosClientId = iosClientId { return iosClientId }
        if let clientId = clientId { return clientId }
        if let plistClientId = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String,
           !plistClientId.isEmpty {
            return plistClientId
        }
        return nil
    }

    /// Build a GIDConfiguration from the resolved client id + optional serverClientID / hostedDomain.
    private func makeConfiguration() -> GIDConfiguration? {
        guard let clientID = resolveClientId() else { return nil }
        return GIDConfiguration(
            clientID: clientID,
            serverClientID: serverClientId,
            hostedDomain: hostedDomain,
            openIDRealm: nil
        )
    }

    private func refreshAndBuildResult(user: GIDGoogleUser, completion: @escaping (AuthResult?, Error?) -> Void) {
        user.refreshTokensIfNeeded { [weak self] refreshedUser, error in
            guard let self = self else { return }

            if let error = error {
                completion(nil, self.createAuthError(code: .tokenExpired, message: error.localizedDescription))
                return
            }

            guard let refreshedUser = refreshedUser else {
                completion(nil, self.createAuthError(code: .internalError, message: "No user data after refresh"))
                return
            }

            let authUser = self.createAuthUser(from: refreshedUser)
            self.currentUser = authUser

            // serverAuthCode is only returned by the interactive sign-in, not on refresh.
            let credential = self.makeCredential(from: refreshedUser, serverAuthCode: nil)
            self.storage.saveCredential(credential, for: self.provider)

            let authResult = AuthResult(
                user: authUser,
                credential: credential,
                additionalUserInfo: nil,
                operationType: "refresh"
            )

            completion(authResult, nil)
        }
    }

    private func makeCredential(from gidUser: GIDGoogleUser, serverAuthCode: String?) -> AuthCredential {
        let grantedScopes = gidUser.grantedScopes ?? scopes
        let expiresAt: Int? = gidUser.accessToken.expirationDate
            .map { Int($0.timeIntervalSince1970 * 1000) }

        return AuthCredential(
            providerId: providerIdString,
            signInMethod: providerIdString,
            accessToken: gidUser.accessToken.tokenString,
            idToken: gidUser.idToken?.tokenString,
            refreshToken: gidUser.refreshToken.tokenString,
            expiresAt: expiresAt,
            tokenType: "Bearer",
            scope: grantedScopes.joined(separator: " "),
            rawNonce: nil,
            serverAuthCode: serverAuthCode
        )
    }

    private func createAuthUser(from gidUser: GIDGoogleUser) -> AuthUser {
        let profile = gidUser.profile

        // BUGFIX: Google profiles from GoogleSignIn do not expose verification state.
        // Google account emails are themselves verified, so treat presence of an email as verified
        // (previously this incorrectly used `profile?.hasImage`).
        let emailVerified = profile?.email != nil

        return AuthUser(
            uid: gidUser.userID ?? "",
            email: profile?.email,
            emailVerified: emailVerified,
            displayName: profile?.name,
            photoURL: profile?.imageURL(withDimension: 200)?.absoluteString,
            phoneNumber: nil,
            isAnonymous: false,
            tenantId: nil,
            providerData: [
                UserInfo(
                    providerId: providerIdString,
                    uid: gidUser.userID ?? "",
                    displayName: profile?.name,
                    email: profile?.email,
                    phoneNumber: nil,
                    photoURL: profile?.imageURL(withDimension: 200)?.absoluteString
                )
            ],
            metadata: UserMetadata(
                creationTime: nil,
                lastSignInTime: ISO8601DateFormatter().string(from: Date()),
                lastRefreshTime: nil
            ),
            refreshToken: gidUser.refreshToken.tokenString,
            customClaims: nil
        )
    }

    /// BUGFIX: modern top-most presenting view controller lookup.
    /// Replaces the deprecated `UIApplication.shared.windows.first` API with a
    /// `connectedScenes`-based key-window lookup, then walks to the top presented controller.
    /// Must be called on the main thread.
    private func topPresentingViewController() -> UIViewController? {
        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }

        let keyWindow = windows.first { $0.isKeyWindow }
            ?? windows.first { $0.windowScene?.activationState == .foregroundActive }
            ?? windows.first

        guard var top = keyWindow?.rootViewController else { return nil }
        while let presented = top.presentedViewController {
            top = presented
        }
        return top
    }
}
