import { Capacitor } from '@capacitor/core';
// @ts-ignore
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';

export class CrashlyticsService {
  /**
   * Initializes or configures Crashlytics context
   */
  static async setContext(uid: string, role: string, gender: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseCrashlytics.setUserId({ userId: uid });
        await FirebaseCrashlytics.setCustomKey({ key: 'role', value: role, type: 'string' });
        await FirebaseCrashlytics.setCustomKey({ key: 'gender', value: gender, type: 'string' });
      } catch (err) {
        console.warn('Crashlytics setContext failed:', err);
      }
    } else {
      // Mock for web
      console.log(`[Crashlytics] setUserId: ${uid}, role: ${role}`);
    }
  }

  /**
   * Logs a non-fatal error
   */
  static async recordException(error: Error | any, context?: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseCrashlytics.recordException({ message: `${context ? `[${context}] ` : ''}${error.message || error}` });
      } catch (err) {
        console.warn('Crashlytics recordException failed:', err);
      }
    } else {
      console.error(`[Crashlytics/Non-Fatal] ${context}:`, error);
    }
  }

  /**
   * Logs a debug message to the crash report
   */
  static async log(message: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseCrashlytics.log({ message });
      } catch (err) {
        // ignore
      }
    } else {
      console.log(`[Crashlytics/Log] ${message}`);
    }
  }
}
