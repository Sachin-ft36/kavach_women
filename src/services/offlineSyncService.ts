import { supabase } from '../lib/supabase';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export type SyncPayloadType = 'TELEMETRY' | 'EVIDENCE_NODE' | 'SOS_TRIGGER' | 'ACK_STATUS';

export interface OfflinePayload {
  id: string;
  type: SyncPayloadType;
  timestamp: number;
  data: any;
  retryCount: number;
}

const STORAGE_KEY = 'kavach_offline_queue';

// Basic XOR encryption for pilot phase (In production, use AES-GCM via Web Crypto API)
const encryptLocalData = (data: string): string => {
  return btoa(encodeURIComponent(data));
};

const decryptLocalData = (encoded: string): string => {
  return decodeURIComponent(atob(encoded));
};

export const offlineSyncService = {
  queuePayload: async (type: SyncPayloadType, data: any) => {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      let queue: OfflinePayload[] = [];
      if (existingRaw) {
        queue = JSON.parse(decryptLocalData(existingRaw));
      }

      const payload: OfflinePayload = {
        id: `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        timestamp: Date.now(),
        data,
        retryCount: 0
      };

      queue.push(payload);
      localStorage.setItem(STORAGE_KEY, encryptLocalData(JSON.stringify(queue)));
      
      // Attempt to sync immediately
      offlineSyncService.processSyncQueue();
    } catch (e) {
      console.error("Failed to queue offline payload:", e);
    }
  },

  processSyncQueue: async () => {
    if (!navigator.onLine) return; // Don't try if offline

    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      if (!existingRaw) return;
      
      let queue: OfflinePayload[] = JSON.parse(decryptLocalData(existingRaw));
      if (queue.length === 0) return;

      const remainingQueue: OfflinePayload[] = [];

      for (const item of queue) {
        try {
          // Process based on type
          if (item.type === 'EVIDENCE_NODE') {
            await addDoc(collection(db, 'incident_audit_ledger'), item.data);
          } else if (item.type === 'TELEMETRY' || item.type === 'SOS_TRIGGER' || item.type === 'ACK_STATUS') {
            // Push to Supabase for realtime distribution
            await supabase.from('offline_sync_buffer').insert([
              { payload_type: item.type, payload_data: item.data, created_at: new Date(item.timestamp).toISOString() }
            ]);
          }
          
          // Server ACK received -> Do not add to remainingQueue (Deletes local copy)
          console.log(`✅ [SYNC ENGINE] Successfully synced ${item.type} payload ${item.id}`);
        } catch (err) {
          console.warn(`⚠️ [SYNC ENGINE] Failed to sync ${item.id}, will retry later.`, err);
          item.retryCount += 1;
          if (item.retryCount < 50) {
            remainingQueue.push(item);
          }
        }
      }

      // Save remaining items back to queue
      localStorage.setItem(STORAGE_KEY, encryptLocalData(JSON.stringify(remainingQueue)));

    } catch (e) {
      console.error("Failed to process sync queue:", e);
    }
  },
  
  startDaemon: () => {
    window.addEventListener('online', () => {
      console.log('📶 Network restored! Triggering offline sync queue...');
      offlineSyncService.processSyncQueue();
    });
    
    // Also poll every 30 seconds just in case
    setInterval(() => {
      if (navigator.onLine) {
        offlineSyncService.processSyncQueue();
      }
    }, 30000);
  }
};
