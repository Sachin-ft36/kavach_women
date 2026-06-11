// Kavach Forensic Crypto Engine
// Handles ECDSA digital signatures for evidence integrity and AES-GCM for offline queue encryption

const DB_NAME = 'kavach_crypto_vault';
const STORE_NAME = 'keys';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredKey<T>(keyId: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(keyId);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

async function storeKey(keyId: string, key: any): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(key, keyId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export const cryptoService = {
  // ----------------------------------------------------
  // ECDSA SIGNATURE ENGINE (For Evidence Nodes)
  // ----------------------------------------------------
  
  async getOrGenerateECDSAKeyPair(): Promise<CryptoKeyPair> {
    const existing = await getStoredKey<CryptoKeyPair>('ecdsa_keypair');
    if (existing) return existing;

    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, // non-extractable private key
      ['sign', 'verify']
    );

    await storeKey('ecdsa_keypair', keyPair);
    return keyPair;
  },

  async getPublicKeyBase64(): Promise<string> {
    const keyPair = await this.getOrGenerateECDSAKeyPair();
    const exported = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    return arrayBufferToBase64(exported);
  },

  async signPayload(dataString: string): Promise<string> {
    const keyPair = await this.getOrGenerateECDSAKeyPair();
    const encoded = new TextEncoder().encode(dataString);
    const signature = await window.crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      keyPair.privateKey,
      encoded
    );
    return arrayBufferToBase64(signature);
  },

  async verifySignature(dataString: string, signatureBase64: string, publicKeyBase64: string): Promise<boolean> {
    try {
      const pubKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
      const signatureBuffer = base64ToArrayBuffer(signatureBase64);
      const encoded = new TextEncoder().encode(dataString);

      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        pubKeyBuffer,
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['verify']
      );

      return await window.crypto.subtle.verify(
        { name: 'ECDSA', hash: { name: 'SHA-256' } },
        publicKey,
        signatureBuffer,
        encoded
      );
    } catch (e) {
      console.error("Signature verification failed", e);
      return false;
    }
  },

  // ----------------------------------------------------
  // AES-GCM ENCRYPTION ENGINE (For Offline Queue)
  // ----------------------------------------------------

  async getOrGenerateAESKey(): Promise<CryptoKey> {
    const existing = await getStoredKey<CryptoKey>('aes_key');
    if (existing) return existing;

    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    await storeKey('aes_key', key);
    return key;
  },

  async encryptData(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
    const key = await this.getOrGenerateAESKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv.buffer)
    };
  },

  async decryptData(ciphertextBase64: string, ivBase64: string): Promise<string> {
    const key = await this.getOrGenerateAESKey();
    const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  }
};
