import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { executeEmergencyBlast } from './sosService';
import { logTelemetryEvent } from '../firebase';

const QUEUE_KEY = 'kavach_offline_sos_queue';

export interface QueuedSOS {
  id: string;
  timestamp: number;
  userPos: any;
  data: any;
  status: 'pending' | 'sent' | 'acknowledged' | 'retrying' | 'dead_letter';
  retryCount: number;
  lastError?: string;
}

export const OfflineQueueService = {
  /**
   * Initializes the network listener to replay the queue when the device comes back online.
   */
  init: () => {
    console.log("🛡️ OFFLINE QUEUE: Initializing network listeners...");
    Network.addListener('networkStatusChange', async (status) => {
      console.log('📡 NETWORK STATUS CHANGED:', status.connected ? 'ONLINE' : 'OFFLINE');
      if (status.connected) {
        await OfflineQueueService.replayQueue();
      }
    });
  },

  enqueueSOS: async (userPos: any, data: any) => {
    try {
      const { value } = await Preferences.get({ key: QUEUE_KEY });
      // TODO: Phase B Queue Encryption hook here
      const queue: QueuedSOS[] = value ? JSON.parse(value) : [];
      
      const newEntry: QueuedSOS = {
        id: `sos_fail_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: Date.now(),
        userPos,
        data: { ...data, offlineQueued: true },
        status: 'pending',
        retryCount: 0
      };

      queue.push(newEntry);
      // TODO: Phase B Queue Encryption hook here
      await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(queue) });
      console.warn(`📦 OFFLINE QUEUE: SOS Dispatch saved to local cache. Queue size: ${queue.length}`);
    } catch (e) {
      console.error("🚨 OFFLINE QUEUE ERROR: Failed to write to local storage.", e);
    }
  },

  replayQueue: async () => {
    try {
      const { value } = await Preferences.get({ key: QUEUE_KEY });
      if (!value) return;

      let queue: QueuedSOS[] = JSON.parse(value); // TODO: Phase B Queue Decryption hook here
      if (queue.length === 0) return;

      console.log(`🚀 OFFLINE QUEUE: Replaying ${queue.length} pending SOS dispatches...`);
      const updatedQueue: QueuedSOS[] = [];

      for (let item of queue) {
        if (item.status === 'acknowledged' || item.status === 'dead_letter') {
          continue; // Already processed
        }

        try {
          item.status = 'sent';
          console.log(`🔄 OFFLINE QUEUE: Attempting dispatch for payload ${item.id} (Retry: ${item.retryCount})`);
          await new Promise(res => setTimeout(res, 500));
          
          const results = await executeEmergencyBlast(null, item.userPos, item.data);
          
          if (results) {
             item.status = 'acknowledged';
             console.log(`✅ OFFLINE QUEUE: Successfully acknowledged payload ${item.id}`);
             logTelemetryEvent('queue_replay_success', { alertId: item.id });
             // Add audit event in Phase B
          } else {
             throw new Error("Server did not return a valid ACK");
          }
        } catch (dispatchErr: any) {
          console.error(`❌ OFFLINE QUEUE: Replay failed for ${item.id}.`, dispatchErr);
          item.retryCount += 1;
          item.lastError = dispatchErr.message || String(dispatchErr);
          item.status = 'retrying';
          logTelemetryEvent('queue_replay_failure', { alertId: item.id, reason: item.lastError, retryCount: item.retryCount });

          if (item.retryCount > 3) {
            item.status = 'dead_letter';
            console.error(`💀 DLQ Triggered for ${item.id}`);
            logTelemetryEvent('queue_failure_dlq', { alertId: item.id, reason: item.lastError });
            // Pushing to Firestore DLQ asynchronously
            import('../firebase').then(({ db }) => {
              import('firebase/firestore').then(({ doc, setDoc, serverTimestamp }) => {
                setDoc(doc(db, 'dead_letter_queue', item.id), {
                   incidentId: item.id,
                   reason: "Exceeded max retries during offline replay",
                   retryCount: item.retryCount,
                   failedAt: serverTimestamp(),
                   lastError: item.lastError,
                   payload: item.data
                }).catch(e => console.error("Failed to write to DLQ in Firestore", e));
              });
            });
          } else {
            updatedQueue.push(item);
          }
        }
      }

      // Update the queue with any items that still failed
      await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(updatedQueue) }); // TODO: Phase B Encryption hook
      
    } catch (e) {
      console.error("🚨 OFFLINE QUEUE ERROR: Failed during replay sequence.", e);
    }
  }
};
