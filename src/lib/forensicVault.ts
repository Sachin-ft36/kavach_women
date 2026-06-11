/**
 * 🛡️ KAVACH FORENSIC VAULT — LOCAL INDEXEDDB ENGINE
 * Zero subscription, zero cloud cost for video/audio.
 * Stores large binary blobs (video/audio) directly in browser's IndexedDB.
 * Snapshots (small JPEGs) still go to Firebase Storage (free tier is fine).
 */

const DB_NAME = 'KavachForensicVault';
const STORE_NAME = 'evidence_blobs';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function openVaultDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('alertId', 'alertId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

export interface VaultEntry {
  id: string;
  alertId: string;
  type: 'CCTV_FEED' | 'Audio Log' | 'Snapshot';
  blob: Blob;
  fileName: string;
  mimeType: string;
  hash: string;
  digitalSignature?: string;
  timestamp: number;
  coords?: string;
  status: string;
}

/**
 * Save a forensic blob to local IndexedDB vault.
 * Returns the entry ID.
 */
export async function saveToVault(entry: VaultEntry): Promise<string> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve(entry.id);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all evidence entries for a specific alert.
 */
export async function getVaultEntries(alertId: string): Promise<VaultEntry[]> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('alertId');
    const req = index.getAll(alertId);
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.timestamp - a.timestamp));
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a single entry by ID.
 */
export async function getVaultEntry(id: string): Promise<VaultEntry | null> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all entries (for full vault view).
 */
export async function getAllVaultEntries(): Promise<VaultEntry[]> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.timestamp - a.timestamp));
    req.onerror = () => reject(req.error);
  });
}

/**
 * Create a temporary object URL from a stored blob (for playback).
 * Caller is responsible for calling URL.revokeObjectURL() when done.
 */
export function createBlobUrl(entry: VaultEntry): string {
  return URL.createObjectURL(entry.blob);
}

/**
 * Trigger a browser download for a vault entry.
 */
export function downloadFromVault(entry: VaultEntry): void {
  const url = URL.createObjectURL(entry.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = entry.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Delete a vault entry.
 */
export async function deleteVaultEntry(id: string): Promise<void> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get total size of all stored blobs (in MB).
 */
export async function getVaultSizeMB(): Promise<number> {
  const entries = await getAllVaultEntries();
  const totalBytes = entries.reduce((sum, e) => sum + (e.blob?.size || 0), 0);
  return parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
}
