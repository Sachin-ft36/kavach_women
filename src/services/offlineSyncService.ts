import { supabase } from '../lib/supabase';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cryptoService } from './cryptoService';
import { Preferences } from '@capacitor/preferences';

export type SyncPayloadType = 'TELEMETRY' | 'EVIDENCE_NODE' | 'SOS_TRIGGER' | 'ACK_STATUS' | 'EVIDENCE_UPLOAD';

export interface OfflinePayload {
  id: string;
  type: SyncPayloadType;
  timestamp: number;
  data: any;
  retryCount: number;
  nextRetryAt: number;
}

const STORAGE_KEY = 'kavach_offline_queue';
const IV_KEY = 'kavach_offline_queue_iv';

export const offlineSyncService = {
  queuePayload: async (type: SyncPayloadType, data: any) => {
    try {
      const { value: existingCipher } = await Preferences.get({ key: STORAGE_KEY });
      const { value: existingIv } = await Preferences.get({ key: IV_KEY });
      let queue: OfflinePayload[] = [];
      
      if (existingCipher && existingIv) {
        try {
          const decrypted = await cryptoService.decryptData(existingCipher, existingIv);
          queue = JSON.parse(decrypted);
        } catch (e) {
          console.error("Failed to decrypt offline queue, creating new one.", e);
          queue = [];
        }
      }

      const payload: OfflinePayload = {
        id: `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        timestamp: Date.now(),
        data,
        retryCount: 0,
        nextRetryAt: Date.now()
      };

      queue.push(payload);
      
      const { ciphertext, iv } = await cryptoService.encryptData(JSON.stringify(queue));
      await Preferences.set({ key: STORAGE_KEY, value: ciphertext });
      await Preferences.set({ key: IV_KEY, value: iv });
      
      // Attempt to sync immediately
      offlineSyncService.processSyncQueue();
    } catch (e) {
      console.error("Failed to queue offline payload:", e);
    }
  },

  processSyncQueue: async () => {
    if (!navigator.onLine) return; // Don't try if offline

    try {
      const { value: existingCipher } = await Preferences.get({ key: STORAGE_KEY });
      const { value: existingIv } = await Preferences.get({ key: IV_KEY });
      if (!existingCipher || !existingIv) return;
      
      let queue: OfflinePayload[] = [];
      try {
        const decrypted = await cryptoService.decryptData(existingCipher, existingIv);
        queue = JSON.parse(decrypted);
      } catch (e) {
        console.error("Decryption of queue failed. Wiping corrupt queue.", e);
        await Preferences.remove({ key: STORAGE_KEY });
        await Preferences.remove({ key: IV_KEY });
        return;
      }

      if (queue.length === 0) return;

      const remainingQueue: OfflinePayload[] = [];
      const now = Date.now();

      for (const item of queue) {
        // Skip if we shouldn't retry yet (Exponential Backoff)
        if (now < item.nextRetryAt) {
          remainingQueue.push(item);
          continue;
        }

        try {
          // Process based on type and wait for explicit network ACKs
          if (item.type === 'EVIDENCE_NODE') {
            const docRef = await addDoc(collection(db, 'incident_audit_ledger'), item.data);
            if (!docRef.id) throw new Error("No Firestore ACK received");
          } else if (item.type === 'EVIDENCE_UPLOAD') {
            const { error } = await supabase.from('evidence').insert([item.data]);
            if (error) throw error;
          } else if (item.type === 'TELEMETRY' || item.type === 'SOS_TRIGGER' || item.type === 'ACK_STATUS') {
            const { error } = await supabase.from('offline_sync_buffer').insert([
              { payload_type: item.type, payload_data: item.data, created_at: new Date(item.timestamp).toISOString() }
            ]);
            if (error) throw error;
          }
          
          // Server ACK received -> Do not add to remainingQueue (Deletes local copy)
          console.log(`✅ [SYNC ENGINE] Successfully synced ${item.type} payload ${item.id}`);
        } catch (err) {
          console.warn(`⚠️ [SYNC ENGINE] Failed to sync ${item.id}, will retry later.`, err);
          item.retryCount += 1;
          
          if (item.retryCount < 50) {
            // Exponential backoff: 2s, 4s, 8s, 16s... up to max 5 minutes
            const backoffMs = Math.min(Math.pow(2, item.retryCount) * 1000, 300000);
            item.nextRetryAt = Date.now() + backoffMs;
            remainingQueue.push(item);
          } else {
             console.error(`❌ [SYNC ENGINE] Max retries reached for ${item.id}. Dropping payload.`);
          }
        }
      }

      // Save remaining items back to queue
      if (remainingQueue.length > 0) {
        const { ciphertext, iv } = await cryptoService.encryptData(JSON.stringify(remainingQueue));
        await Preferences.set({ key: STORAGE_KEY, value: ciphertext });
        await Preferences.set({ key: IV_KEY, value: iv });
      } else {
        await Preferences.remove({ key: STORAGE_KEY });
        await Preferences.remove({ key: IV_KEY });
      }

    } catch (e) {
      console.error("Failed to process sync queue:", e);
    }
  },
  
  startDaemon: () => {
    window.addEventListener('online', () => {
      console.log('📶 Network restored! Triggering offline sync queue...');
      offlineSyncService.processSyncQueue();
    });
    
    // Also poll every 30 seconds to catch payloads that hit their backoff timer
    setInterval(() => {
      if (navigator.onLine) {
        offlineSyncService.processSyncQueue();
      }
    }, 30000);
  }
};
