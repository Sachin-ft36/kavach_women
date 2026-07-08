import { registerPlugin, Capacitor } from '@capacitor/core';
import { useKavachStore } from '../state/useKavachStore';
import { executeEmergencyBlast } from './sosService';

// Fallback interface in case the plugin typing isn't fully exported
export interface SiriShortcutsPlugin {
  donate(options: { persistentIdentifier: string; title: string; suggestedInvocationPhrase: string; userInfo?: any; isEligibleForSearch?: boolean; isEligibleForPrediction?: boolean }): Promise<void>;
  present(options: { persistentIdentifier: string; title: string; suggestedInvocationPhrase: string }): Promise<void>;
  addListener(eventName: 'appShortcutReceived', listenerFunc: (info: { persistentIdentifier: string; userInfo?: any }) => void): any;
}

const SiriShortcuts = registerPlugin<SiriShortcutsPlugin>('SiriShortcuts');

class SiriEmergencyService {
  private isInitialized = false;

  async initialize() {
    // ✅ iOS-only: Siri Shortcuts only work on native iOS. Skip silently on web/Android.
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
    if (this.isInitialized) return;
    
    try {
      // Register the shortcut to Siri
      await SiriShortcuts.donate({
        persistentIdentifier: 'com.kavach.app.sos',
        title: 'Trigger Kavach SOS',
        suggestedInvocationPhrase: 'Kavach Help',
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
      });

      // Listen for Siri invoking the shortcut
      SiriShortcuts.addListener('appShortcutReceived', async (info) => {
        if (info.persistentIdentifier === 'com.kavach.app.sos') {
          console.warn("🚨 KAVACH TRIGGERED VIA SIRI 🚨");
          const state = useKavachStore.getState();
          state.setSOSActive(true);
          await executeEmergencyBlast(state.user, state.userPos);
        }
      });

      this.isInitialized = true;
      console.log('✅ Siri Shortcuts Registered for Kavach (iOS)');
    } catch (e) {
      // Silently ignore — plugin not available on this build
    }
  }
}

export const siriEmergencyService = new SiriEmergencyService();
