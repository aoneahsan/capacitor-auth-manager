import Foundation
import Capacitor

class GitHubAuthProvider: OAuthWebProvider {

    init(config: AuthProviderConfig, storage: AuthStorage, logger: AuthLogger) {
        super.init(
            provider: .github,
            config: config,
            storage: storage,
            logger: logger,
            authUrl: "https://github.com/login/oauth/authorize",
            tokenUrl: "https://github.com/login/oauth/access_token",
            userInfoUrl: "https://api.github.com/user",
            defaultScopes: ["user:email", "read:user"]
        )
    }

    override func parseUserInfo(json: [String: Any]) -> AuthUser {
        let uid = (json["id"] as? Int).map { String($0) } ?? ""
        let email = json["email"] as? String
        let name = json["name"] as? String ?? json["login"] as? String
        let avatarUrl = json["avatar_url"] as? String
        let login = json["login"] as? String

        return AuthUser(
            uid: uid,
            email: email,
            emailVerified: email != nil,
            displayName: name,
            photoURL: avatarUrl,
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
                    photoURL: avatarUrl
                )
            ],
            metadata: UserMetadata(
                creationTime: json["created_at"] as? String,
                lastSignInTime: ISO8601DateFormatter().string(from: Date()),
                lastRefreshTime: nil
            ),
            refreshToken: nil,
            customClaims: ["login": login as Any]
        )
    }
}
