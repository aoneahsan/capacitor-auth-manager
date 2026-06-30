import Foundation
import Capacitor
import AuthenticationServices

class AppleAuthProvider: NSObject, BaseAuthProvider {
    let provider: AuthProvider = .apple
    let storage: AuthStorage
    let logger: AuthLogger

    private var currentUser: AuthUser?
    private var signInCompletion: ((AuthResult?, Error?) -> Void)?
    private var currentNonce: String?

    init(config: AuthProviderConfig, storage: AuthStorage, logger: AuthLogger) {
        self.storage = storage
        self.logger = logger
        super.init()
    }

    func initialize(completion: @escaping (Error?) -> Void) {
        logger.info("Initializing Apple auth provider")

        // Check for existing credential
        if let savedCredential = storage.getCredential(for: provider) {
            // Verify the credential is still valid
            let appleIDProvider = ASAuthorizationAppleIDProvider()
            appleIDProvider.getCredentialState(forUserID: savedCredential.accessToken ?? "") { [weak self] state, error in
                switch state {
                case .authorized:
                    self?.logger.info("Apple credential is still valid")
                case .revoked, .notFound:
                    self?.storage.deleteCredential(for: .apple)
                    self?.currentUser = nil
                default:
                    break
                }
                completion(nil)
            }
        } else {
            completion(nil)
        }
    }

    func signIn(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        logger.info("Starting Apple sign-in")

        signInCompletion = completion
        currentNonce = generateNonce()

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]

        if let nonce = currentNonce {
            request.nonce = sha256(nonce)
        }

        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()
    }

    func signOut(options: JSObject?, completion: @escaping (Error?) -> Void) {
        logger.info("Signing out from Apple")

        currentUser = nil
        storage.deleteCredential(for: provider)
        completion(nil)
    }

    func getCurrentUser(completion: @escaping (AuthUser?, Error?) -> Void) {
        completion(currentUser, nil)
    }

    func refreshToken(options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        // Apple doesn't support token refresh - need to re-authenticate
        completion(nil, createAuthError(code: .operationNotAllowed, message: "Apple Sign In doesn't support token refresh. Please sign in again."))
    }

    func isSupported(completion: @escaping (Bool, Error?) -> Void) {
        // Apple Sign In is available on iOS 13+
        if #available(iOS 13.0, *) {
            completion(true, nil)
        } else {
            completion(false, nil)
        }
    }

    func linkAccount(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void) {
        signIn(credentials: credentials, options: options, completion: completion)
    }

    func unlinkAccount(completion: @escaping (Error?) -> Void) {
        signOut(options: nil, completion: completion)
    }

    func getIdToken(forceRefresh: Bool, completion: @escaping (String?, Error?) -> Void) {
        if let credential = storage.getCredential(for: provider) {
            completion(credential.idToken, nil)
        } else {
            completion(nil, createAuthError(code: .invalidUserToken, message: "No Apple credential found"))
        }
    }

    func revokeAccess(token: String?, completion: @escaping (Error?) -> Void) {
        // Apple doesn't have a direct revoke API
        signOut(options: nil, completion: completion)
    }

    // MARK: - Nonce Generation

    private func generateNonce(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remainingLength = length

        while remainingLength > 0 {
            let randoms: [UInt8] = (0 ..< 16).map { _ in
                var random: UInt8 = 0
                let errorCode = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
                if errorCode != errSecSuccess {
                    fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
                }
                return random
            }

            randoms.forEach { random in
                if remainingLength == 0 { return }
                if random < charset.count {
                    result.append(charset[Int(random)])
                    remainingLength -= 1
                }
            }
        }

        return result
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        inputData.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(inputData.count), &hash)
        }
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension AppleAuthProvider: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            signInCompletion?(nil, createAuthError(code: .internalError, message: "Invalid credential type"))
            return
        }

        logger.info("Apple sign-in successful")

        let userIdentifier = appleIDCredential.user
        let fullName = appleIDCredential.fullName
        let email = appleIDCredential.email

        var idTokenString: String?
        if let identityToken = appleIDCredential.identityToken,
           let tokenString = String(data: identityToken, encoding: .utf8) {
            idTokenString = tokenString
        }

        var authorizationCodeString: String?
        if let authorizationCode = appleIDCredential.authorizationCode,
           let codeString = String(data: authorizationCode, encoding: .utf8) {
            authorizationCodeString = codeString
        }

        let displayName: String? = {
            if let givenName = fullName?.givenName, let familyName = fullName?.familyName {
                return "\(givenName) \(familyName)"
            } else if let givenName = fullName?.givenName {
                return givenName
            }
            return nil
        }()

        let authUser = AuthUser(
            uid: userIdentifier,
            email: email,
            emailVerified: email != nil,
            displayName: displayName,
            photoURL: nil,
            phoneNumber: nil,
            isAnonymous: false,
            tenantId: nil,
            providerData: [
                UserInfo(
                    providerId: provider.rawValue,
                    uid: userIdentifier,
                    displayName: displayName,
                    email: email,
                    phoneNumber: nil,
                    photoURL: nil
                )
            ],
            metadata: UserMetadata(
                creationTime: ISO8601DateFormatter().string(from: Date()),
                lastSignInTime: ISO8601DateFormatter().string(from: Date()),
                lastRefreshTime: nil
            ),
            refreshToken: nil,
            customClaims: nil
        )

        currentUser = authUser

        let credential = AuthCredential(
            providerId: provider.rawValue,
            signInMethod: "apple",
            accessToken: userIdentifier,
            idToken: idTokenString,
            refreshToken: authorizationCodeString,
            expiresAt: nil,
            tokenType: "Bearer",
            scope: "email name",
            rawNonce: currentNonce
        )

        storage.saveCredential(credential, for: provider)

        let authResult = AuthResult(
            user: authUser,
            credential: credential,
            additionalUserInfo: AdditionalUserInfo(
                isNewUser: email != nil, // Apple only provides email on first sign-in
                providerId: provider.rawValue,
                profile: nil,
                username: nil
            ),
            operationType: "signIn"
        )

        signInCompletion?(authResult, nil)
        signInCompletion = nil
        currentNonce = nil
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        logger.error("Apple sign-in failed: \(error.localizedDescription)")

        let authError: Error
        if let asError = error as? ASAuthorizationError {
            switch asError.code {
            case .canceled:
                authError = createAuthError(code: .userCancelled, message: "User cancelled sign-in")
            case .invalidResponse:
                authError = createAuthError(code: .internalError, message: "Invalid response from Apple")
            case .notHandled:
                authError = createAuthError(code: .internalError, message: "Authorization not handled")
            case .failed:
                authError = createAuthError(code: .internalError, message: "Authorization failed")
            case .notInteractive:
                authError = createAuthError(code: .internalError, message: "Non-interactive authorization failed")
            case .unknown:
                authError = createAuthError(code: .internalError, message: "Unknown error")
            @unknown default:
                authError = createAuthError(code: .internalError, message: error.localizedDescription)
            }
        } else {
            authError = createAuthError(code: .internalError, message: error.localizedDescription)
        }

        signInCompletion?(nil, authError)
        signInCompletion = nil
        currentNonce = nil
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding

extension AppleAuthProvider: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return UIApplication.shared.windows.first { $0.isKeyWindow } ?? UIApplication.shared.windows.first!
    }
}

// MARK: - CommonCrypto Import
import CommonCrypto
