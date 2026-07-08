import { PermissionEngine } from './PermissionEngine';

export interface CapabilityResponse {
  canExecute: boolean;
  confidence: number; // 0 - 100
  reason: 'Ready' | 'No Permission' | 'Low Battery' | 'Offline' | 'Degraded Network' | string;
}

export class CapabilityEngine {
  /**
   * Determine capability to start an active Journey
   */
  public static async canStartJourney(): Promise<CapabilityResponse> {
    const locPermission = await PermissionEngine.checkPermission('location');
    if (locPermission !== 'granted') {
      return { canExecute: false, confidence: 0, reason: 'No Permission' };
    }

    const networkOnline = navigator.onLine;
    if (!networkOnline) {
      // Journeys can start offline with degraded tracking, but confidence is lowered
      return { canExecute: true, confidence: 40, reason: 'Offline' };
    }

    return { canExecute: true, confidence: 100, reason: 'Ready' };
  }

  /**
   * Determine capability to trigger a live SOS incident
   */
  public static async canTriggerSOS(): Promise<CapabilityResponse> {
    const locPermission = await PermissionEngine.checkPermission('location');
    const audioPermission = await PermissionEngine.checkPermission('microphone');

    if (locPermission !== 'granted') {
      return { canExecute: true, confidence: 50, reason: 'No Location Permission (Fallback to SMS Alert)' };
    }

    const networkOnline = navigator.onLine;
    if (!networkOnline) {
      return { canExecute: true, confidence: 30, reason: 'Offline (Broadcasting via local SMS fallback queues)' };
    }

    let confidence = 100;
    if (audioPermission !== 'granted') {
      confidence -= 20; // Degraded audio evidence recording, but SOS dispatch proceeds
    }

    return { canExecute: true, confidence, reason: 'Ready' };
  }

  /**
   * Determine capability to record ambient security evidence
   */
  public static async canRecordEvidence(): Promise<CapabilityResponse> {
    const cameraPermission = await PermissionEngine.checkPermission('camera');
    const micPermission = await PermissionEngine.checkPermission('microphone');

    if (cameraPermission !== 'granted' && micPermission !== 'granted') {
      return { canExecute: false, confidence: 0, reason: 'No Permission' };
    }

    let confidence = 100;
    let reason = 'Ready';

    if (cameraPermission !== 'granted' || micPermission !== 'granted') {
      confidence = 50;
      reason = cameraPermission !== 'granted' ? 'Audio-only Recording' : 'Video-only Recording';
    }

    return { canExecute: true, confidence, reason };
  }
}
