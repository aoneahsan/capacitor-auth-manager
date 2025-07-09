import Foundation
import Security

class AuthStorage {
    private let keyPrefix = "cap_auth_"
    
    enum Persistence: String {
        case local = "local"
        case session = "session"
        case none = "none"
    }
    
    private var persistence: Persistence = .local
    
    func setPersistence(_ persistence: String) {
        self.persistence = Persistence(rawValue: persistence) ?? .local
    }
    
    func get(_ key: String) -> String? {
        let fullKey = keyPrefix + key
        
        switch persistence {
        case .local:
            return UserDefaults.standard.string(forKey: fullKey)
        case .session:
            return getFromKeychain(key: fullKey)
        case .none:
            return nil
        }
    }
    
    func set(_ key: String, value: String) {
        let fullKey = keyPrefix + key
        
        switch persistence {
        case .local:
            UserDefaults.standard.set(value, forKey: fullKey)
        case .session:
            saveToKeychain(key: fullKey, value: value)
        case .none:
            break
        }
    }
    
    func remove(_ key: String) {
        let fullKey = keyPrefix + key
        
        switch persistence {
        case .local:
            UserDefaults.standard.removeObject(forKey: fullKey)
        case .session:
            deleteFromKeychain(key: fullKey)
        case .none:
            break
        }
    }
    
    func clear() {
        // Clear all auth-related keys
        let defaults = UserDefaults.standard
        for key in defaults.dictionaryRepresentation().keys {
            if key.hasPrefix(keyPrefix) {
                defaults.removeObject(forKey: key)
            }
        }
    }
    
    func setLastAuthProvider(_ provider: String) {
        set("last_auth_provider", value: provider)
    }
    
    func getLastAuthProvider() -> String? {
        return get("last_auth_provider")
    }
    
    func removeLastAuthProvider() {
        remove("last_auth_provider")
    }
    
    func setCustomParameters(provider: String, parameters: [String: Any]) {
        if let data = try? JSONSerialization.data(withJSONObject: parameters),
           let jsonString = String(data: data, encoding: .utf8) {
            set("\(provider)_custom_params", value: jsonString)
        }
    }
    
    func getCustomParameters(provider: String) -> [String: Any]? {
        guard let jsonString = get("\(provider)_custom_params"),
              let data = jsonString.data(using: .utf8),
              let parameters = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return parameters
    }
    
    // MARK: - Keychain Helpers
    
    private func saveToKeychain(key: String, value: String) {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func getFromKeychain(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess,
           let data = dataTypeRef as? Data,
           let value = String(data: data, encoding: .utf8) {
            return value
        }
        
        return nil
    }
    
    private func deleteFromKeychain(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}