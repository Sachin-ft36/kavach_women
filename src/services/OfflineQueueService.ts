import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { executeEmergencyBlast } from './sosService';

const QUEUE_KEY = 'kavach_offline_sos_queue';

export interface QueuedSOS {
  id: string;
  timestamp: number;
  userPos: any;
  data: any;
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

  /**
   * Adds a failed SOS dispatch to the secure offline queue.
   */
  enqueueSOS: async (userPos: any, data: any) => {
    try {
      const { value } = await Preferences.get({ key: QUEUE_KEY });
      const queue: QueuedSOS[] = value ? JSON.parse(value) : [];
      
      const newEntry: QueuedSOS = {
        id: `sos_fail_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: Date.now(),
        userPos,
        data: { ...data, offlineQueued: true }
      };

      queue.push(newEntry);
      await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(queue) });
      console.warn(`📦 OFFLINE QUEUE: SOS Dispatch saved to local cache. Queue size: ${queue.length}`);
    } catch (e) {
      console.error("🚨 OFFLINE QUEUE ERROR: Failed to write to local storage.", e);
    }
  },

  /**
   * Reads the queue and attempts to replay all pending SOS dispatches.
   */
  replayQueue: async () => {
    try {
      const { value } = await Preferences.get({ key: QUEUE_KEY });
      if (!value) return;

      let queue: QueuedSOS[] = JSON.parse(value);
      if (queue.length === 0) return;

      console.log(`🚀 OFFLINE QUEUE: Replaying ${queue.length} pending SOS dispatches...`);
      const failedQueue: QueuedSOS[] = [];

      for (const item of queue) {
        try {
          // Attempt dispatch
          console.log(`🔄 OFFLINE QUEUE: Attempting dispatch for payload ${item.id}`);
          // Wait briefly to prevent rate limits
          await new Promise(res => setTimeout(res, 500));
          
          const results = await executeEmergencyBlast(null, item.userPos, item.data);
          console.log(`✅ OFFLINE QUEUE: Successfully flushed payload ${item.id}`);
        } catch (dispatchErr) {
          console.error(`❌ OFFLINE QUEUE: Replay failed for ${item.id}, re-queuing.`, dispatchErr);
          failedQueue.push(item);
        }
      }

      // Update the queue with any items that still failed
      await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(failedQueue) });
      
    } catch (e) {
      console.error("🚨 OFFLINE QUEUE ERROR: Failed during replay sequence.", e);
    }
  }
};
