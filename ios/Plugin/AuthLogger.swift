import Foundation

class AuthLogger {
    enum LogLevel: Int {
        case debug = 0
        case info = 1
        case warn = 2
        case error = 3
        
        var emoji: String {
            switch self {
            case .debug: return "🔍"
            case .info: return "ℹ️"
            case .warn: return "⚠️"
            case .error: return "❌"
            }
        }
    }
    
    private var isEnabled: Bool = false
    private var logLevel: LogLevel = .info
    private let prefix = "CapacitorAuthManager"
    
    func setEnabled(_ enabled: Bool) {
        self.isEnabled = enabled
    }
    
    func setLogLevel(_ level: String) {
        switch level.lowercased() {
        case "debug": self.logLevel = .debug
        case "info": self.logLevel = .info
        case "warn": self.logLevel = .warn
        case "error": self.logLevel = .error
        default: self.logLevel = .info
        }
    }
    
    func debug(_ message: String, _ items: Any...) {
        log(.debug, message, items)
    }
    
    func info(_ message: String, _ items: Any...) {
        log(.info, message, items)
    }
    
    func warn(_ message: String, _ items: Any...) {
        log(.warn, message, items)
    }
    
    func error(_ message: String, _ error: Error? = nil) {
        if let error = error {
            log(.error, message, [error.localizedDescription])
        } else {
            log(.error, message, [])
        }
    }
    
    private func log(_ level: LogLevel, _ message: String, _ items: [Any]) {
        guard isEnabled && level.rawValue >= logLevel.rawValue else { return }
        
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        var logMessage = "\(level.emoji) [\(timestamp)] [\(prefix)] \(message)"
        
        if !items.isEmpty {
            let itemsString = items.map { "\($0)" }.joined(separator: " ")
            logMessage += " \(itemsString)"
        }
        
        print(logMessage)
    }
}