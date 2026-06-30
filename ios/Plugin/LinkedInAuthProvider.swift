import Foundation
import Capacitor

class LinkedInAuthProvider: OAuthWebProvider {

    init(config: AuthProviderConfig, storage: AuthStorage, logger: AuthLogger) {
        super.init(
            provider: .linkedin,
            config: config,
            storage: storage,
            logger: logger,
            authUrl: "https://www.linkedin.com/oauth/v2/authorization",
            tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
            userInfoUrl: "https://api.linkedin.com/v2/userinfo",
            defaultScopes: ["openid", "profile", "email"]
        )
    }

    override func parseUserInfo(json: [String: Any]) -> AuthUser {
        // LinkedIn OpenID Connect userinfo endpoint response
        let uid = json["sub"] as? String ?? ""
        let email = json["email"] as? String
        let emailVerified = json["email_verified"] as? Bool ?? false
        let name = json["name"] as? String
        let givenName = json["given_name"] as? String
        let familyName = json["family_name"] as? String
        let picture = json["picture"] as? String
        let locale = json["locale"] as? String

        var displayName = name
        if displayName == nil && (givenName != nil || familyName != nil) {
            displayName = [givenName, familyName].compactMap { $0 }.joined(separator: " ")
        }

        return AuthUser(
            uid: uid,
            email: email,
            emailVerified: emailVerified,
            displayName: displayName,
            photoURL: picture,
            phoneNumber: nil,
            isAnonymous: false,
            tenantId: nil,
            providerData: [
                UserInfo(
                    providerId: provider.rawValue,
                    uid: uid,
                    displayName: displayName,
                    email: email,
                    phoneNumber: nil,
                    photoURL: picture
                )
            ],
            metadata: UserMetadata(
                creationTime: nil,
                lastSignInTime: ISO8601DateFormatter().string(from: Date()),
                lastRefreshTime: nil
            ),
            refreshToken: nil,
            customClaims: locale != nil ? ["locale": locale as Any] : nil
        )
    }
}
