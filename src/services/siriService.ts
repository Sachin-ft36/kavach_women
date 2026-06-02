import { registerPlugin } from '@capacitor/core';
import { useKavachStore } from '../store/useKavachStore';
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
        console.log('SIRI SHORTCUT TRIGGERED:', info);
        if (info.persistentIdentifier === 'com.kavach.app.sos') {
          // Trigger the master SOS logic
          console.warn("🚨 KAVACH TRIGGERED VIA SIRI 🚨");
          
          const state = useKavachStore.getState();
          state.setSOSActive(true);
          
          // Trigger hardware/backend blast
          await executeEmergencyBlast(state.user, state.userPos);
        }
      });

      this.isInitialized = true;
      console.log('✅ Siri Shortcuts Registered for Kavach');
    } catch (e) {
      console.warn('Siri Shortcuts not supported on this platform or failed to initialize:', e);
    }
  }
}

export const siriEmergencyService = new SiriEmergencyService();
