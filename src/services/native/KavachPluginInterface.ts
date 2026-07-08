import { registerPlugin } from '@capacitor/core';

export interface KavachPlugin {
  // 🎙️ Acoustic Sentinel (Voice keyword monitoring)
  startVoiceSentinel(): Promise<void>;
  stopVoiceSentinel(): Promise<void>;
  
  // 📳 Kinetic Sentinel (Background sensor monitoring)
  startBackgroundSentinel(): Promise<void>;
  stopBackgroundSentinel(): Promise<void>;
  
  // 📡 Mission Critical Dispatch Utilities
  broadcastEmergencySMS(options: { numbers: string[]; message: string }): Promise<void>;
  initiateEmergencyCall(options: { number: string }): Promise<void>;
  updateGuardianContacts(options: { contacts: string }): Promise<void>;
  setUserRole(options: { role: string }): Promise<void>;
  
  // 🚨 Hardware Interceptors & Alarms
  startContinuousSiren(): Promise<void>;
  stopContinuousSiren(): Promise<void>;
  startForensicCapture(): Promise<void>;
  stopForensicCapture(): Promise<void>;
  
  // 🔒 Platform Security & OS Settings Overrides
  isOverlayPermissionGranted(): Promise<{ granted: boolean }>;
  openOverlaySettings(): Promise<void>;
  hasFullScreenIntentPermission(): Promise<{ granted: boolean }>;
  openFullScreenIntentSettings(): Promise<void>;
  isIgnoringBatteryOptimizations(): Promise<{ isExempt: boolean }>;
  openBatterySettings(): Promise<void>;
  triggerHapticPulse(): Promise<void>;
  requestSensitivePermissions(): Promise<void>;
  openAppSettings(): Promise<void>;
  checkSafetyPermissions(): Promise<{ sms: string; call: string; microphone: string }>;
  showUrgentNotification(options: { title: string; body: string; id: string; sound: string }): Promise<void>;
  getPhoneHint(): Promise<{ number?: string }>;
  requestLockScreenPermission(): Promise<void>;
  consumeTrigger(): Promise<{ source: string }>;
  setAppStealthMode(options: { enabled: boolean }): Promise<void>;
  startSafeTimer(options: { durationMins: number }): Promise<void>;
  stopSafeTimer(): Promise<void>;
  scheduleFakeCall(options: { delaySeconds: number }): Promise<void>;
  playEmergencyRingtone(): Promise<void>;
  stopEmergencyRingtone(): Promise<void>;
  
  // 🔐 Storage Crypto
  encryptQueue(options: { data: string }): Promise<{ ciphertext: string; iv: string; version: number }>;
  decryptQueue(options: { ciphertext: string; iv: string }): Promise<{ data: string }>;

  // 📡 BLE Mesh SOS Relays
  startBleSOSAdvertising(options: { victimUid: string; latitude: number; longitude: number }): Promise<void>;
  stopBleSOSAdvertising(): Promise<void>;
  startBleSOSScanning(): Promise<void>;
  stopBleSOSScanning(): Promise<void>;

  // 🔆 Screen Hardware Control
  setScreenBrightness(options: { level: number }): Promise<void>;
  keepScreenOn(options: { enable: boolean }): Promise<void>;
}

export const KavachNative = registerPlugin<KavachPlugin>('KavachPlugin');
