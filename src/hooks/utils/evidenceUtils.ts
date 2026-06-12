import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// --- SHA-256 HASH ---
export async function generateForensicHash(data: Blob | string): Promise<string> {
  const msgUint8 = data instanceof Blob
    ? new Uint8Array(await data.arrayBuffer())
    : new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- COMPRESS IMAGE TO 320×240 JPEG (~5-8KB) ---
export async function compressSnapshot(rawBlob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(rawBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d')!;
      // Fill black background first
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 320, 240);
      // Letterbox scale
      const scale = Math.min(320 / img.width, 240 / img.height);
      const w = img.width  * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (320 - w) / 2, (240 - h) / 2, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (b) => resolve(b || rawBlob),
        'image/jpeg',
        0.3   // quality 0.3 → ~5-8KB
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(rawBlob); };
    img.src = url;
  });
}

// --- UPLOAD TO CLOUD (Bypass Firebase Storage -> Use Base64 in Firestore) ---
export async function uploadToCloud(blob: Blob, path: string): Promise<string> {
  // Since you don't have a Pro plan for Storage, we convert the small compressed
  // audio (~50KB) and images (~8KB) directly into base64 Data URIs. 
  // These will be saved directly inside the Firestore document (which allows up to 1MB).
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      console.warn('Base64 conversion failed');
      resolve('');
    };
    reader.readAsDataURL(blob);
  });
}

// --- NATIVE BLACKBOX (Android/iOS) ---
export async function saveToLocalBlackbox(fileName: string, blob: Blob): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    await Filesystem.writeFile({
      path: `KAVACH/Forensics/${fileName}`,
      data: base64,
      directory: Directory.Documents,
      recursive: true
    });
  } catch (e) {
    console.error('Blackbox write failure:', e);
  }
}

// --- BEST SUPPORTED MIME TYPES ---
export function getSupportedVideoMimeType(): string {
  const candidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
}

export function getSupportedAudioMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
}
