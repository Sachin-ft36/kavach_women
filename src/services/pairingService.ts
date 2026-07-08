/**
 * pairingService.ts
 * Handles the actual Firestore writes for guardian ↔ ward pairing,
 * called when a guardian approves a pending pairing_request document.
 */

import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { supabase } from '../lib/supabase';

export async function executePairingWrite(payload: any, guardianProfile: any): Promise<void> {
  const wardId = payload.ward_id;

  const guardianPhone: string = guardianProfile.phoneNumber || guardianProfile.phone || '';
  if (!guardianPhone) {
    throw new Error('GUARDIAN_PHONE_MISSING');
  }

  const guardianCleanPhone = `+91${guardianPhone.replace(/\D/g, '').slice(-10)}`;

  // 1. Update the ward's user document with primaryGuardian info
  const wardDocRef = doc(db, 'users', wardId);
  await updateDoc(wardDocRef, {
    primaryGuardian: {
      name: guardianProfile.name || 'Guardian',
      phone: guardianCleanPhone,
      relation: 'Guardian',
    },
  });

  // 2. Add a guardian entry to the ward's guardians subcollection
  await addDoc(collection(db, 'users', wardId, 'guardians'), {
    name: guardianProfile.name || 'Guardian',
    phone: guardianCleanPhone,
    relation: 'Guardian',
    createdAt: serverTimestamp(),
  });

  // 3. (optional) Sync to Supabase profiles metadata for local cache recovery
  try {
    const { data: profileSnap } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', wardId)
      .single();

    if (profileSnap?.metadata !== undefined) {
      const updatedMeta = {
        ...profileSnap.metadata,
        primaryGuardian: {
          name: guardianProfile.name || 'Guardian',
          phone: guardianCleanPhone,
          relation: 'Guardian',
        },
      };
      await supabase.from('profiles').update({ metadata: updatedMeta }).eq('id', wardId);
    }
  } catch (subErr) {
    console.warn('Supabase profiles metadata sync failed (non-critical):', subErr);
  }
}
