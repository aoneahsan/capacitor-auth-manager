import Foundation
import Capacitor

// MARK: - Enums

enum AuthProvider: String, CaseIterable {
    case google = "google"
    case apple = "apple"
    case microsoft = "microsoft"
    case facebook = "facebook"
    case github = "github"
    case slack = "slack"
    case linkedin = "linkedin"
    case firebase = "firebase"
    case emailMagicLink = "email_magic_link"
    case sms = "sms"
    case emailPassword = "email_password"
    case phonePassword = "phone_password"
    case usernamePassword = "username_password"
    case emailCode = "email_code"
    case biometric = "biometric"
}

enum AuthPersistence: String {
    case local = "local"
    case session = "session"
    case none = "none"
}

enum AuthErrorCode: String {
    case invalidCredentials = "auth/invalid-credentials"
    case userNotFound = "auth/user-not-found"
    case wrongPassword = "auth/wrong-password"
    case emailAlreadyInUse = "auth/email-already-in-use"
    case weakPassword = "auth/weak-password"
    case networkError = "auth/network-error"
    case tooManyRequests = "auth/too-many-requests"
    case userDisabled = "auth/user-disabled"
    case operationNotAllowed = "auth/operation-not-allowed"
    case invalidEmail = "auth/invalid-email"
    case invalidPhoneNumber = "auth/invalid-phone-number"
    case invalidVerificationCode = "auth/invalid-verification-code"
    case expiredActionCode = "auth/expired-action-code"
    case credentialAlreadyInUse = "auth/credential-already-in-use"
    case accountExistsWithDifferentCredential = "auth/account-exists-with-different-credential"
    case requiresRecentLogin = "auth/requires-recent-login"
    case providerAlreadyLinked = "auth/provider-already-linked"
    case noSuchProvider = "auth/no-such-provider"
    case invalidUserToken = "auth/invalid-user-token"
    case tokenExpired = "auth/token-expired"
    case userTokenExpired = "auth/user-token-expired"
    case invalidApiKey = "auth/invalid-api-key"
    case userCancelled = "auth/user-cancelled"
    case appNotAuthorized = "auth/app-not-authorized"
    case keychainError = "auth/keychain-error"
    case internalError = "auth/internal-error"
    case biometricNotAvailable = "auth/biometric-not-available"
    case biometricNotEnrolled = "auth/biometric-not-enrolled"
    case biometricAuthenticationFailed = "auth/biometric-authentication-failed"
    case unsupportedProvider = "auth/unsupported-provider"
    case missingConfiguration = "auth/missing-configuration"
    case popupBlocked = "auth/popup-blocked"
    case popupClosedByUser = "auth/popup-closed-by-user"
    case redirectCancelledByUser = "auth/redirect-cancelled-by-user"
    case missingRedirectUrl = "auth/missing-redirect-url"
    case invalidState = "auth/invalid-state"
}

// MARK: - Models

struct AuthManagerInitOptions {
    let providers: [AuthProviderConfig]
    let persistence: AuthPersistence
    let autoRefreshToken: Bool
    let tokenRefreshBuffer: Int
    let enableLogging: Bool
    let logLevel: String
}

struct AuthProviderConfig {
    let provider: AuthProvider
    let options: JSObject
    
    init(provider: AuthProvider, options: JSObject) {
        self.provider = provider
        self.options = options
    }
    
    init(from jsObject: JSObject) throws {
        guard let providerString = jsObject["provider"] as? String,
              let provider = AuthProvider(rawValue: providerString),
              let options = jsObject["options"] as? JSObject else {
            throw AuthManagerError.invalidConfiguration
        }
        
        self.provider = provider
        self.options = options
    }
}

struct SignInOptions {
    let provider: AuthProvider
    let credentials: JSObject?
    let options: JSObject?
}

struct SignOutOptions {
    let provider: AuthProvider?
    let revokeToken: Bool
    let clearCache: Bool
    let redirectUrl: String?
}

struct AuthResult {
    let user: AuthUser
    let credential: AuthCredential
    let additionalUserInfo: AdditionalUserInfo?
    let operationType: String?
    
    func toJSObject() -> JSObject {
        var result: JSObject = [
            "user": user.toJSObject(),
            "credential": credential.toJSObject()
        ]
        
        if let additionalUserInfo = additionalUserInfo {
            result["additionalUserInfo"] = additionalUserInfo.toJSObject()
        }
        
        if let operationType = operationType {
            result["operationType"] = operationType
        }
        
        return result
    }
}

struct AuthUser {
    let uid: String
    let email: String?
    let emailVerified: Bool
    let displayName: String?
    let photoURL: String?
    let phoneNumber: String?
    let isAnonymous: Bool
    let tenantId: String?
    let providerData: [UserInfo]
    let metadata: UserMetadata
    let refreshToken: String?
    let customClaims: JSObject?
    
    func toJSObject() -> JSObject {
        var result: JSObject = [
            "uid": uid,
            "emailVerified": emailVerified,
            "isAnonymous": isAnonymous,
            "providerData": providerData.map { $0.toJSObject() },
            "metadata": metadata.toJSObject()
        ]
        
        if let email = email { result["email"] = email }
        if let displayName = displayName { result["displayName"] = displayName }
        if let photoURL = photoURL { result["photoURL"] = photoURL }
        if let phoneNumber = phoneNumber { result["phoneNumber"] = phoneNumber }
        if let tenantId = tenantId { result["tenantId"] = tenantId }
        if let refreshToken = refreshToken { result["refreshToken"] = refreshToken }
        if let customClaims = customClaims { result["customClaims"] = customClaims }
        
        return result
    }
}

struct UserInfo {
    let providerId: String
    let uid: String
    let displayName: String?
    let email: String?
    let phoneNumber: String?
    let photoURL: String?
    
    func toJSObject() -> JSObject {
        var result: JSObject = [
            "providerId": providerId,
            "uid": uid
        ]
        
        if let displayName = displayName { result["displayName"] = displayName }
        if let email = email { result["email"] = email }
        if let phoneNumber = phoneNumber { result["phoneNumber"] = phoneNumber }
        if let photoURL = photoURL { result["photoURL"] = photoURL }
        
        return result
    }
}

struct UserMetadata {
    let creationTime: String?
    let lastSignInTime: String?
    let lastRefreshTime: String?
    
    func toJSObject() -> JSObject {
        var result: JSObject = [:]
        
        if let creationTime = creationTime { result["creationTime"] = creationTime }
        if let lastSignInTime = lastSignInTime { result["lastSignInTime"] = lastSignInTime }
        if let lastRefreshTime = lastRefreshTime { result["lastRefreshTime"] = lastRefreshTime }
        
        return result
    }
}

struct AuthCredential {
    let providerId: String
    let signInMethod: String
    let accessToken: String?
    let idToken: String?
    let refreshToken: String?
    let expiresAt: Int?
    let tokenType: String?
    let scope: String?
    let rawNonce: String?
    
    func toJSObject() -> JSObject {
        var result: JSObject = [
            "providerId": providerId,
            "signInMethod": signInMethod
        ]
        
        if let accessToken = accessToken { result["accessToken"] = accessToken }
        if let idToken = idToken { result["idToken"] = idToken }
        if let refreshToken = refreshToken { result["refreshToken"] = refreshToken }
        if let expiresAt = expiresAt { result["expiresAt"] = expiresAt }
        if let tokenType = tokenType { result["tokenType"] = tokenType }
        if let scope = scope { result["scope"] = scope }
        if let rawNonce = rawNonce { result["rawNonce"] = rawNonce }
        
        return result
    }
}

struct AdditionalUserInfo {
    let isNewUser: Bool
    let providerId: String
    let profile: JSObject?
    let username: String?
    
    func toJSObject() -> JSObject {
        var result: JSObject = [
            "isNewUser": isNewUser,
            "providerId": providerId
        ]
        
        if let profile = profile { result["profile"] = profile }
        if let username = username { result["username"] = username }
        
        return result
    }
}

struct RefreshTokenOptions {
    let provider: AuthProvider?
    let forceRefresh: Bool
}

struct IsSupportedResult {
    let isSupported: Bool
    let reason: String?
    let availableProviders: [AuthProvider]
    
    func toJSObject() -> JSObject {
        var result: JSObject = [
            "isSupported": isSupported,
            "availableProviders": availableProviders.map { $0.rawValue }
        ]
        
        if let reason = reason { result["reason"] = reason }
        
        return result
    }
}

struct LinkAccountOptions {
    let provider: AuthProvider
    let credentials: JSObject?
    let options: JSObject?
}

struct PasswordResetOptions {
    let email: String
    let actionCodeSettings: JSObject?
}

struct EmailVerificationOptions {
    let actionCodeSettings: JSObject?
}

struct SendSmsCodeOptions {
    let phoneNumber: String
    let recaptchaToken: String?
    let testCode: String?
}

struct VerifySmsCodeOptions {
    let phoneNumber: String
    let code: String
    let verificationId: String?
}

struct SendEmailCodeOptions {
    let email: String
    let recaptchaToken: String?
    let testCode: String?
}

struct VerifyEmailCodeOptions {
    let email: String
    let code: String
    let verificationId: String?
}

struct UpdateProfileOptions {
    let displayName: String?
    let photoURL: String?
    let phoneNumber: String?
    let customClaims: JSObject?
}

struct DeleteAccountOptions {
    let requireReauthentication: Bool
    let provider: AuthProvider?
    let credentials: JSObject?
}

struct GetIdTokenOptions {
    let forceRefresh: Bool
    let provider: AuthProvider?
}

struct RevokeAccessOptions {
    let provider: AuthProvider?
    let token: String?
}

// MARK: - Errors

enum AuthManagerError: LocalizedError {
    case notInitialized
    case invalidProvider
    case providerNotConfigured(AuthProvider)
    case providerNotImplemented(AuthProvider)
    case missingConfiguration(String)
    case invalidConfiguration
    case noProviderSpecified
    case operationNotSupported
    
    var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "Auth manager not initialized"
        case .invalidProvider:
            return "Invalid provider"
        case .providerNotConfigured(let provider):
            return "Provider \(provider.rawValue) not configured"
        case .providerNotImplemented(let provider):
            return "Provider \(provider.rawValue) not implemented"
        case .missingConfiguration(let field):
            return "Missing configuration: \(field)"
        case .invalidConfiguration:
            return "Invalid configuration"
        case .noProviderSpecified:
            return "No provider specified"
        case .operationNotSupported:
            return "Operation not supported"
        }
    }
}