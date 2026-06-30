import Foundation
import Capacitor

class SlackAuthProvider: OAuthWebProvider {

    init(config: AuthProviderConfig, storage: AuthStorage, logger: AuthLogger) {
        super.init(
            provider: .slack,
            config: config,
            storage: storage,
            logger: logger,
            authUrl: "https://slack.com/oauth/v2/authorize",
            tokenUrl: "https://slack.com/api/oauth.v2.access",
            userInfoUrl: "https://slack.com/api/users.identity",
            defaultScopes: ["openid", "profile", "email"]
        )
    }

    override func parseUserInfo(json: [String: Any]) -> AuthUser {
        // Slack returns user info nested under "user" key
        let userJson = json["user"] as? [String: Any] ?? json

        let uid = userJson["id"] as? String ?? ""
        let email = userJson["email"] as? String
        let name = userJson["name"] as? String
        let realName = userJson["real_name"] as? String ?? name

        var avatarUrl: String?
        if let image = userJson["image_512"] as? String {
            avatarUrl = image
        } else if let image = userJson["image_192"] as? String {
            avatarUrl = image
        } else if let image = userJson["image_72"] as? String {
            avatarUrl = image
        }

        // Get team info if available
        let team = json["team"] as? [String: Any]
        let teamId = team?["id"] as? String

        return AuthUser(
            uid: uid,
            email: email,
            emailVerified: email != nil,
            displayName: realName,
            photoURL: avatarUrl,
            phoneNumber: nil,
            isAnonymous: false,
            tenantId: teamId,
            providerData: [
                UserInfo(
                    providerId: provider.rawValue,
                    uid: uid,
                    displayName: realName,
                    email: email,
                    phoneNumber: nil,
                    photoURL: avatarUrl
                )
            ],
            metadata: UserMetadata(
                creationTime: nil,
                lastSignInTime: ISO8601DateFormatter().string(from: Date()),
                lastRefreshTime: nil
            ),
            refreshToken: nil,
            customClaims: teamId != nil ? ["teamId": teamId as Any] : nil
        )
    }

    override func fetchUserInfo(accessToken: String, completion: @escaping (AuthUser?, Error?) -> Void) {
        // Slack requires the token as a query parameter, not in Authorization header
        var urlComponents = URLComponents(string: "https://slack.com/api/users.identity")!
        urlComponents.queryItems = [URLQueryItem(name: "token", value: accessToken)]

        guard let url = urlComponents.url else {
            completion(nil, createAuthError(code: .internalError, message: "Failed to construct URL"))
            return
        }

        var request = URLRequest(url: url)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

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

            // Check if response is OK
            if let ok = json["ok"] as? Bool, !ok {
                let errorMsg = json["error"] as? String ?? "Unknown error"
                completion(nil, self.createAuthError(code: .internalError, message: errorMsg))
                return
            }

            let user = self.parseUserInfo(json: json)
            completion(user, nil)
        }.resume()
    }
}
