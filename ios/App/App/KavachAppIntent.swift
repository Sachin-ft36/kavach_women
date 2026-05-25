import AppIntents
import Foundation

@available(iOS 16.0, *)
struct EngageKavachStealthIntent: AppIntent {
    static var title: LocalizedStringResource = "Engage Kavach ThreatProtect"
    
    // CRITICAL: Bypasses lock screen pin requirement to run immediately when triggered
    static var authenticationPolicy: IntentAuthenticationPolicy = .none 

    @MainActor
    func perform() async throws -> some IntentResult {
        print("🚨 iOS HARDWARE SHORTCUT: Intent received natively on lock screen.")
        
        // Notify the plugin directly
        if let plugin = KavachPlugin.getInstance() {
            plugin.triggerPanicExternally()
            print("🚨 iOS HARDWARE SHORTCUT: Dispatched directly to KavachPlugin instance.")
        } else {
            print("🚨 iOS HARDWARE SHORTCUT: KavachPlugin instance was null during perform callback.")
        }
        
        return .result()
    }
}
