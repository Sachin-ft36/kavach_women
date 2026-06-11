import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';

export interface TrustReport {
  score: number;
  flags: string[];
  isEmulator: boolean;
}

export class DeviceIntegrityService {
  /**
   * Calculates a 0-100 Device Trust Score based on hardware metrics.
   * Helps prevent bot-driven SOS spam and location spoofing.
   */
  static async calculateTrustScore(): Promise<TrustReport> {
    let score = 100;
    const flags: string[] = [];
    let isEmulator = false;

    if (!Capacitor.isNativePlatform()) {
      score -= 30;
      flags.push('WEB_PLATFORM');
    } else {
      try {
        const info = await Device.getInfo();
        
        if (info.isVirtual) {
          score -= 50;
          isEmulator = true;
          flags.push('EMULATOR_DETECTED');
        }

        if (info.operatingSystem === 'ios' || info.operatingSystem === 'android') {
          // Native bonus points or penalties based on OS version
          if (info.osVersion && parseFloat(info.osVersion) < 10) {
            score -= 10;
            flags.push('OUTDATED_OS');
          }
        }
        
      } catch (e) {
        flags.push('INFO_READ_FAILED');
      }

      // Check mock location if GPS is enabled
      try {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        // Some plugins attach `mocked` property to GeolocationPosition if mock provider is used
        if ((pos as any).mocked || (pos.coords as any).mocked) {
          score -= 60;
          flags.push('MOCKED_LOCATION');
        }
      } catch (e) {
        score -= 20;
        flags.push('GPS_DISABLED_OR_DENIED');
      }
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return { score, flags, isEmulator };
  }
}
