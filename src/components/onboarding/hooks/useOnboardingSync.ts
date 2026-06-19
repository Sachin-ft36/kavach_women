import { useState } from 'react';
import { db } from '../../../firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useKavachStore } from '../../../store/useKavachStore';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { getReverseMetadata } from '../../../services/locationService';
import { KavachNative } from '../../../services/KavachNative';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';

export function useOnboardingSync(
  user: any,
  role: string | null,
  gender: string | null,
  userName: string,
  userPhone: string,
  safetyPin: string,
  photoUrl: string,
  address: string,
  bloodGroup: string,
  dob: string,
  aadhaar: string,
  guardians: any[],
  protectorData: any,
  onComplete: () => void
) {
  const { setRole: setStoreRole, setGender: setStoreGender } = useKavachStore();
  const [isFinishing, setIsFinishing] = useState(false);

  const finishOnboarding = async () => {
    if (!user) return;
    setIsFinishing(true);
    try {
      let existingData: any = {};
      try {
        const currentSnap = await getDoc(doc(db, 'users', user.uid));
        if (currentSnap.exists()) {
          existingData = currentSnap.data();
        }
      } catch (docErr) {
        console.warn("Could not fetch existing profile (likely offline), proceeding with empty defaults.", docErr);
      }

      let initialLocation = existingData.lastLocation || null;
      let fullAddress = existingData.fullAddress || "Sector Unknown";
      let locationMeta: any = null;

      try {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        initialLocation = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
        locationMeta = await getReverseMetadata(position.coords.latitude, position.coords.longitude);
        fullAddress = locationMeta.display || `Sector Grid: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      } catch (geoError) { }

      const isCitizen = role === 'citizen';
      const isPcr = role === 'pcr_officer';

      const userProfile = {
        uid: user.uid,
        name: (userName || protectorData.fullName || existingData.name || user?.displayName || "User"),
        email: user.email || existingData.email || "",
        phoneNumber: userPhone || existingData.phoneNumber || user.phoneNumber || "",
        safetyPin: safetyPin || existingData.safetyPin || "",
        role: role || existingData.role || 'citizen',
        gender: gender || existingData.gender || 'female',
        isRegistered: true,
        photoUrl: photoUrl || existingData.photoUrl || "",
        address: address || existingData.address || "",
        bloodGroup: bloodGroup || existingData.bloodGroup || "",
        dob: dob || existingData.dob || "",
        isVerified: user.role === 'admin' || user.role === 'super_cell' ? true : false,
        verificationStatus: user.role === 'admin' || user.role === 'super_cell' ? 'approved' : 'pending',
        aadhaarMask: aadhaar ? `XXXX-XXXX-${aadhaar.slice(-4)}` : (existingData.aadhaarMask || null),
        aadhaarHash: aadhaar ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(aadhaar)).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')) : (existingData.aadhaarHash || null),

        vehicleNo: isPcr ? (protectorData.vehicleNo || 'PCR-TBD') : (existingData.vehicleNo || null),
        badgeId: isPcr ? (protectorData.badgeId || 'BADGE-TBD') : (existingData.badgeId || null),
        rank: isPcr ? (protectorData.rank || 'Officer') : (existingData.rank || null),
        thanaName: isPcr ? (protectorData.thanaName || 'Headquarters') : (existingData.thanaName || null),
        isOnDuty: isPcr ? true : (existingData.isOnDuty || false),
        currentDispatchStatus: isPcr ? 'idle' : (existingData.currentDispatchStatus || null),

        lastLocation: initialLocation,
        locationData: {
          lat: initialLocation?.lat || null,
          lng: initialLocation?.lng || null,
          accuracy: initialLocation?.accuracy || null,
          city: locationMeta?.city || fullAddress.split(',').slice(-3, -2)[0]?.trim() || "Unknown",
          district: locationMeta?.suburb || fullAddress.split(',').slice(-4, -3)[0]?.trim() || "Unknown",
          state: locationMeta?.state || fullAddress.split(',').slice(-2, -1)[0]?.trim() || "Unknown",
          pincode: locationMeta?.pincode || fullAddress.match(/\b\d{6}\b/)?.[0] || "Unknown",
          formattedAddress: fullAddress
        },
        fullAddress: fullAddress,
        state: locationMeta?.state || fullAddress.split(',').slice(-2, -1)[0]?.trim() || "Unknown",

        primaryGuardian: (guardians.length > 0) ? {
          name: guardians[0].name,
          phone: `+91${guardians[0].phone.replace(/\D/g, '')}`,
          relation: guardians[0].relation
        } : (existingData.primaryGuardian || null),

        onboardedAt: existingData.onboardedAt || serverTimestamp(),
        lastActive: serverTimestamp(),
        protectorVetting: (!isCitizen) ? (protectorData.fullName ? protectorData : existingData.protectorVetting) : null
      };

      const syncTasks = async () => {
        const cleanProfile = Object.fromEntries(
          Object.entries(userProfile).filter(([_, v]) => v !== undefined && v !== null && v !== "")
        );

        await setDoc(doc(db, 'users', user.uid), cleanProfile, { merge: true });

        try {
          const supabasePayload: any = {
            id: user.uid,
            email: user.email || cleanProfile.email || "",
            role: cleanProfile.role || 'citizen',
            is_verified: !!cleanProfile.isVerified,
            gender: cleanProfile.gender || 'female',
            xp: cleanProfile.xp || 0,
            metadata: cleanProfile
          };
          if (initialLocation && initialLocation.lat && initialLocation.lng) {
            supabasePayload.last_location = `POINT(${initialLocation.lng} ${initialLocation.lat})`;
          }
          await supabase.from('profiles').upsert(supabasePayload);
        } catch (supabaseErr) {
          console.warn("Supabase onboarding sync failed:", supabaseErr);
        }

        const finalGender = gender || existingData.gender || 'female';
        if (finalGender === 'male') {
          await setDoc(doc(db, 'male_users', user.uid), cleanProfile, { merge: true });
        } else {
          await setDoc(doc(db, 'women_users', user.uid), cleanProfile, { merge: true });
          if (userProfile.role === 'citizen') {
            await setDoc(doc(db, 'women_users', user.uid, 'safety_data', 'status'), {
              active: true, setupAt: serverTimestamp(), type: 'Citizen/Safety'
            }, { merge: true });
          }
          if (userProfile.role === 'protector') {
            await setDoc(doc(db, 'women_users', user.uid, 'protector_data', 'status'), {
              active: true, setupAt: serverTimestamp(), type: 'Protector/Rakshak'
            }, { merge: true });
          }
        }

        if (userProfile.role === 'citizen' && guardians.length > 0) {
          const guardianCol = collection(db, 'users', user.uid, 'guardians');
          const localGuardians = guardians.map(g => ({
            name: g.name,
            phone: `+91${g.phone.replace(/\D/g, '').slice(-10)}`,
            relation: g.relation
          }));
          localStorage.setItem('kavach_guardian_cache', JSON.stringify(localGuardians));

          for (const g of guardians) {
            if (g.name && g.phone) {
              const cleanPhone = g.phone.replace(/\D/g, '').slice(-10);
              const fullCleanPhone = `+91${cleanPhone}`;
              await addDoc(guardianCol, {
                name: g.name, phone: fullCleanPhone, relation: g.relation || 'Guardian', createdAt: serverTimestamp()
              }).catch(() => { });

              // 🛡️ Create pending link for the guardian
              await setDoc(doc(db, 'guardian_pending_links', fullCleanPhone), {
                citizenUid: user.uid,
                citizenName: userProfile.name,
                citizenPhone: userProfile.phoneNumber,
                relationship: g.relation || 'Guardian',
                createdAt: serverTimestamp()
              }, { merge: true }).catch(() => { });
            }
          }
        }

        // 🛡️ Auto-resolve pending links if registering as a Guardian
        if (userProfile.role === 'guardian') {
          const cleanPhone = userProfile.phoneNumber;
          try {
            const claimSnap = await getDoc(doc(db, 'guardian_pending_links', cleanPhone));
            if (claimSnap.exists()) {
              const claimData = claimSnap.data();
              userProfile.protectorVetting = {
                ...(userProfile.protectorVetting || {}),
                isGuardian: true,
                familyPhone: claimData.citizenPhone,
                linkedFamilyName: claimData.citizenName
              };
              // Update local state copy
              cleanProfile.protectorVetting = userProfile.protectorVetting;
            }
          } catch (e) {
            console.error("Error reading pending links:", e);
          }
        }

        if (Capacitor.isNativePlatform()) {
          KavachNative.startBackgroundSentinel().catch(() => { });
        }
      };

      await syncTasks();

      const finalRole = userProfile.role;
      const finalGender = userProfile.gender;

      setStoreRole(finalRole as any);
      setStoreGender(finalGender as any);
      const store = useKavachStore.getState();
      if (userProfile.safetyPin) store.setSafetyPin(userProfile.safetyPin);
      store.setRegistered(true);
      store.setVerified(userProfile.isVerified);
      localStorage.setItem('kavach_hardware_synced', 'true');
      onComplete();
    } catch (e: any) {
      console.error("Configuration Sync Failure:", e);
      toast.error(`Configuration Error: ${e.message}`);
    } finally {
      setIsFinishing(false);
    }
  };

  return { isFinishing, setIsFinishing, finishOnboarding };
}
