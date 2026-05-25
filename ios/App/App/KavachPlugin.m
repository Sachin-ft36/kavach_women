#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Register methods to the bridge so React/TypeScript can call them via Capacitor
CAP_PLUGIN(KavachPlugin, "KavachPlugin",
           CAP_PLUGIN_METHOD(startVoiceSentinel, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopVoiceSentinel, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(triggerHapticPulse, CAPPluginReturnPromise);
)
