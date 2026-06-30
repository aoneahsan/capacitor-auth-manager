import Foundation
import Capacitor
import AuthenticationServices

class OAuthWebProvider: NSObject, BaseAuthProvider, ASWebAuthenticationPresentationContextProviding {
    let provider: AuthProvider
    let storage: AuthStorage
    let logger: AuthLogger

    private var clientId: String?
    private var clientSecret: String?
    private var redirectUri: String?
    private var scopes: [String]
    private var authUrl: String
    private var tokenUrl: String
    private var userInfoUrl: String
    private var currentUser: AuthUser?

    private var webAuthSession: ASWebAuthenticationSession?

    init(
        provider: AuthProvider,
        config: AuthProviderConfig,
        storage: AuthStorage,
        logger: AuthLogger,
        authUrl: String,
        tokenUrl: String,
        userInfoUrl: String,
        defaultScopes: [String]
    ) {
        self.provider = provider
        self.storage = storage
        self.logger = logger
        self.authUrl = authUrl
        self.tokenUrl = tokenUrl
        self.userInfoUrl = userInfoUrl
        self.scopes = defaultScopes

        super.init()

        if let clientId = config.options["clientId"] as? String {
            self.clientId = clientId
        }
        if let clientSecret = config.options["clientSecret"] as? String {
            self.clientSecret = clientSecret
        }
        if let redirectUri = config.options["redirectUri"] as? String {
            self.redirectUri = redirectUri
        }
        if let scopes = config.options["scopes"] as? [String] {
            self.scopes = scopes
        }
    }

    func initialize(completion: @escaping (Error?) -> Void) {
        logger.info("Initializing \(provider.rawValue) OAuth provider")

        // Check for existing credential
        if let credential = storage.getCredential(for: provider) {
            if let accessToken = credential.accessToken {
                fetchUserInfo(accessToken: accessToken) { [weak self] user, _ in
                    self?.currentUser = user
                    completion(nil)
                }
                return
            }
        }

        completion(nil)
    }

    func signIn(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Starting \(provider.rawValue) sign-in")

        guard let clientId = clientId else {
            completion(nil, createAuthError(code: .missingConfiguration, message: "Client ID is required"))
            return
        }

        guard let redirectUri = redirectUri else {
            completion(nil, createAuthError(code: .missingConfiguration, message: "Redirect URI is required"))
            return
        }

        let state = UUID().uuidString
        let scopeString = scopes.joined(separator: " ")

        var urlComponents = URLComponents(string: authUrl)!
        urlComponents.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: redirectUri),
            URLQueryItem(name: "scope", value: scopeString),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "response_type", value: "code")
        ]

        guard let authURL = urlComponents.url else {
            completion(nil, createAuthError(code: .internalError, message: "Failed to construct auth URL"))
            return
        }

        guard let callbackScheme = URL(string: redirectUri)?.scheme else {
            completion(nil, createAuthError(code: .internalError, message: "Invalid redirect URI scheme"))
            return
        }

        webAuthSession = ASWebAuthenticationSession(
            url: authURL,
            callbackURLScheme: callbackScheme
        ) { [weak self] callbackURL, error in
            guard let self = self else { return }

            if let error = error as? ASWebAuthenticationSessionError {
                if error.code == .canceledLogin {
                    completion(nil, self.createAuthError(code: .userCancelled, message: "User cancelled sign-in"))
                } else {
                    completion(nil, self.createAuthError(code: .internalError, message: error.localizedDescription))
                }
                return
            }

            guard let callbackURL = callbackURL else {
                completion(nil, self.createAuthError(code: .internalError, message: "No callback URL"))
                return
            }

            guard let code = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
                    .queryItems?.first(where: { $0.name == "code" })?.value else {
                completion(nil, self.createAuthError(code: .internalError, message: "No authorization code"))
                return
            }

            self.exchangeCodeForToken(code: code, redirectUri: redirectUri, completion: completion)
        }

        webAuthSession?.presentationContextProvider = self
        webAuthSession?.prefersEphemeralWebBrowserSession = false
        webAuthSession?.start()
    }

    private func exchangeCodeForToken(code: String, redirectUri: String, completion: @escaping (AuthResult?, Error?) -> Void) {
        guard let clientId = clientId else {
            completion(nil, createAuthError(code: .missingConfiguration, message: "Client ID is required"))
            return
        }

        var request = URLRequest(url: URL(string: tokenUrl)!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        var body = "client_id=\(clientId)&code=\(code)&redirect_uri=\(redirectUri)&grant_type=authorization_code"
        if let clientSecret = clientSecret {
            body += "&client_secret=\(clientSecret)"
        }
        request.httpBody = body.data(using: .utf8)

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            if let error = error {
                DispatchQueue.main.async {
                    completion(nil, self.createAuthError(code: .networkError, message: error.localizedDescription))
                }
                return
            }

            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let accessToken = json["access_token"] as? String else {
                DispatchQueue.main.async {
                    completion(nil, self.createAuthError(code: .internalError, message: "Failed to parse token response"))
                }
                return
            }

            let refreshToken = json["refresh_token"] as? String
            let expiresIn = json["expires_in"] as? Int
            let scope = json["scope"] as? String

            self.fetchUserInfo(accessToken: accessToken) { [weak self] user, error in
                guard let self = self else { return }

                DispatchQueue.main.async {
                    if let error = error {
                        completion(nil, error)
                        return
                    }

                    guard let user = user else {
                        completion(nil, self.createAuthError(code: .internalError, message: "Failed to fetch user info"))
                        return
                    }

                    self.currentUser = user

                    let credential = AuthCredential(
                        providerId: self.provider.rawValue,
                        signInMethod: "oauth",
                        accessToken: accessToken,
                        idToken: nil,
                        refreshToken: refreshToken,
                        expiresAt: expiresIn != nil ? Int(Date().timeIntervalSince1970 * 1000) + (expiresIn! * 1000) : nil,
                        tokenType: "Bearer",
                        scope: scope,
                        rawNonce: nil
                    )

                    self.storage.saveCredential(credential, for: self.provider)

                    let result = AuthResult(
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

                    self.logger.info("\(self.provider.rawValue) sign-in successful")
                    completion(result, nil)
                }
            }
        }.resume()
    }

    func fetchUserInfo(accessToken: String, completion: @escaping (AuthUser?, Error?) -> Void) {
        var request = URLRequest(url: URL(string: userInfoUrl)!)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            if let error = error {
                completion(nil, self.createAuthError(code: .networkError, message: error.localizedDescription))
                return
            }

            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(nil, self.createAuthError(code: .internalError, message: "Failed to parse user info"))
                return
            }

            let user = self.parseUserInfo(json: json)
            completion(user, nil)
        }.resume()
    }

    func parseUserInfo(json: [String: Any]) -> AuthUser {
        // Override in subclasses for provider-specific parsing
        let uid = (json["id"] as? Int).map { String($0) } ?? (json["id"] as? String) ?? ""
        let email = json["email"] as? String
        let name = json["name"] as? String ?? json["login"] as? String
        let avatar = json["avatar_url"] as? String ?? json["picture"] as? String

        return AuthUser(
            uid: uid,
            email: email,
            emailVerified: email != nil,
            displayName: name,
            photoURL: avatar,
            phoneNumber: nil,
            isAnonymous: false,
            tenantId: nil,
            providerData: [
                UserInfo(
                    providerId: provider.rawValue,
                    uid: uid,
                    displayName: name,
                    email: email,
                    phoneNumber: nil,
                    photoURL: avatar
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

    func signOut(options: JSObject?, completion: @escaping (Error?) -> Void) {
        logger.info("Signing out from \(provider.rawValue)")
        currentUser = nil
        storage.deleteCredential(for: provider)
        completion(nil)
    }

    func getCurrentUser(completion: @escaping (AuthUser?, Error?) -> Void) {
        completion(currentUser, nil)
    }

    func refreshToken(options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Refreshing \(provider.rawValue) token")

        guard let credential = storage.getCredential(for: provider),
              let refreshToken = credential.refreshToken else {
            completion(nil, createAuthError(code: .tokenExpired, message: "No refresh token available"))
            return
        }

        guard let clientId = clientId else {
            completion(nil, createAuthError(code: .missingConfiguration, message: "Client ID is required"))
            return
        }

        var request = URLRequest(url: URL(string: tokenUrl)!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        var body = "client_id=\(clientId)&refresh_token=\(refreshToken)&grant_type=refresh_token"
        if let clientSecret = clientSecret {
            body += "&client_secret=\(clientSecret)"
        }
        request.httpBody = body.data(using: .utf8)

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            DispatchQueue.main.async {
                if let error = error {
                    completion(nil, self.createAuthError(code: .networkError, message: error.localizedDescription))
                    return
                }

                guard let data = data,
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let accessToken = json["access_token"] as? String else {
                    completion(nil, self.createAuthError(code: .internalError, message: "Failed to refresh token"))
                    return
                }

                let newRefreshToken = json["refresh_token"] as? String ?? refreshToken
                let expiresIn = json["expires_in"] as? Int

                let newCredential = AuthCredential(
                    providerId: self.provider.rawValue,
                    signInMethod: "oauth",
                    accessToken: accessToken,
                    idToken: nil,
                    refreshToken: newRefreshToken,
                    expiresAt: expiresIn != nil ? Int(Date().timeIntervalSince1970 * 1000) + (expiresIn! * 1000) : nil,
                    tokenType: "Bearer",
                    scope: credential.scope,
                    rawNonce: nil
                )

                self.storage.saveCredential(newCredential, for: self.provider)

                guard let user = self.currentUser else {
                    completion(nil, self.createAuthError(code: .internalError, message: "No current user"))
                    return
                }

                let result = AuthResult(
                    user: user,
                    credential: newCredential,
                    additionalUserInfo: nil,
                    operationType: "refresh"
                )

                completion(result, nil)
            }
        }.resume()
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
        if let credential = storage.getCredential(for: provider),
           let accessToken = credential.accessToken {
            if forceRefresh {
                refreshToken(options: nil) { result, error in
                    if let result = result {
                        completion(result.credential.accessToken, nil)
                    } else {
                        completion(nil, error)
                    }
                }
            } else {
                completion(accessToken, nil)
            }
        } else {
            completion(nil, createAuthError(code: .invalidUserToken, message: "No token found"))
        }
    }

    func revokeAccess(token: String?, completion: @escaping (Error?) -> Void) {
        signOut(options: nil, completion: completion)
    }

    // MARK: - ASWebAuthenticationPresentationContextProviding

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return UIApplication.shared.windows.first { $0.isKeyWindow }!
    }
}
