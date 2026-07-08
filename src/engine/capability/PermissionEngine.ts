export type PermissionType = 'location' | 'camera' | 'microphone' | 'notifications';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export class PermissionEngine {
  private static platform: 'android' | 'ios' | 'web' = 'web'; // Default, resolved during bootstrap

  public static setPlatform(platform: 'android' | 'ios' | 'web'): void {
    this.platform = platform;
  }

  /**
   * Check status of a specific native permission
   */
  public static async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    if (this.platform === 'web') {
      try {
        // Query permissions via Navigator API on modern browsers
        if (navigator.permissions) {
          const nameMap: Record<PermissionType, PermissionName> = {
            location: 'geolocation',
            camera: 'camera' as PermissionName,
            microphone: 'microphone' as PermissionName,
            notifications: 'notifications',
          };
          const result = await navigator.permissions.query({ name: nameMap[type] });
          return result.state as PermissionStatus;
        }
      } catch (err) {
        return 'unsupported';
      }
    }

    // Adapt native bridges for Android / iOS platforms
    // (Stub: returns granted in simulated desktop shell environment)
    return 'granted';
  }

  /**
   * Request system authorization for a permission type
   */
  public static async requestPermission(type: PermissionType): Promise<PermissionStatus> {
    if (this.platform === 'web') {
      try {
        if (type === 'location') {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve('granted'),
              () => resolve('denied')
            );
          });
        }
        if (type === 'notifications') {
          const res = await Notification.requestPermission();
          return res as PermissionStatus;
        }
        if (type === 'camera') {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          return 'granted';
        }
        if (type === 'microphone') {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          return 'granted';
        }
      } catch (err) {
        return 'denied';
      }
    }

    return 'granted';
  }
}
