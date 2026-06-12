export * from './native/KavachPluginInterface';
import { KavachSafeDispatch } from './native/dispatch';
import { KavachSafeHardware } from './native/hardware';
import { KavachSafeSentinel } from './native/sentinel';
import { KavachSafeSecurity } from './native/security';
import { KavachSafePermissions } from './native/permissions';
import { KavachSafeTimers } from './native/timers';

/**
 * 🛡️ GLOBAL HARDWARE BRIDGE (Resilient Wrapper)
 * Safely polyfills hardware tasks in web views and protects against native runtime crashes.
 */
export const KavachSafe = {
  ...KavachSafeDispatch,
  ...KavachSafeHardware,
  ...KavachSafeSentinel,
  ...KavachSafeSecurity,
  ...KavachSafePermissions,
  ...KavachSafeTimers
};
