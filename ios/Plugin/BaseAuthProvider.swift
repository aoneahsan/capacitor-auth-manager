import Foundation
import Capacitor

protocol BaseAuthProvider {
    var provider: AuthProvider { get }
    var storage: AuthStorage { get }
    var logger: AuthLogger { get }
    
    func initialize(completion: @escaping (Error?) -> Void)
    func signIn(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void)
    func signOut(options: JSObject?, completion: @escaping (Error?) -> Void)
    func getCurrentUser(completion: @escaping (AuthUser?, Error?) -> Void)
    func refreshToken(options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void)
    func isSupported(completion: @escaping (Bool, Error?) -> Void)
    func linkAccount(credentials: JSObject?, options: JSObject?, completion: @escaping (AuthResult?, Error?) -> Void)
    func unlinkAccount(completion: @escaping (Error?) -> Void)
    func getIdToken(forceRefresh: Bool, completion: @escaping (String?, Error?) -> Void)
    func revokeAccess(token: String?, completion: @escaping (Error?) -> Void)
}

extension BaseAuthProvider {
    func createAuthError(code: AuthErrorCode, message: String) -> NSError {
        return NSError(
            domain: "CapacitorAuthManager",
            code: code.hashValue,
            userInfo: [
                NSLocalizedDescriptionKey: message,
                "code": code.rawValue,
                "provider": provider.rawValue
            ]
        )
    }
}