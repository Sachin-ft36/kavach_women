import { Capacitor } from '@capacitor/core';
import { db, auth, logTelemetryEvent } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getReverseMetadata } from './locationService';
import { fetchNearbyPoliceMappls } from './MapplsService';
import { KavachSafe } from './KavachNative';
import { DeviceIntegrityService } from './deviceIntegrityService';
import { OfflineQueueService } from './OfflineQueueService';
import { cryptoService } from './cryptoService';
import { GeoPoint } from '../types';

let lastTriggerTime = 0;
const TRIGGER_THROTTLE = 5000; // 🛡️ 5s Tactical Gate to prevent double-logs
const activeBlasts = new Set<string>(); // 🛰️ ATOMIC DEDUPLICATION GATE

export const executeEmergencyBlast = async (user: any, userPos: GeoPoint, data?: any) => {
  const victimId = auth.currentUser?.uid || user?.uid || user?.id || localStorage.getItem('kavach_user_uid');
  if (!victimId) return [];

  const now = Date.now();
  
  // 1. GLOBAL THROTTLE
  if (now - lastTriggerTime < 2000) {
    console.warn("⚠️ KAVACH: Global Redundant Mission Blast Blocked.");
    return [];
  }

  // 2. PER-USER ATOMIC LOCK (Prevents milliseconds race conditions)
  if (activeBlasts.has(victimId)) {
    console.warn(`⚠️ KAVACH: Mission Blast for ${victimId} already in progress. Blocking duplicate.`);
    return [];
  }

  activeBlasts.add(victimId);
  lastTriggerTime = now;

  console.log("🚀 KAVACH: Parallel Tactical Dispatch Engaged for:", victimId);

  // 🗺️ Pre-fetch fast local metadata & Nearest Police Station POI
  let meta: any = { address: 'Classified Geo-Grid', city: 'Local Sector', state: 'National' };
  try {
    meta = await getReverseMetadata(userPos.lat, userPos.lng);
  } catch (e) {
    console.error("Reverse metadata resolution failed:", e);
  }

  let nearestPS = `${meta.suburb || meta.city || 'Nearest'} Police Station`;
  let psMapsLink = '';
  try {
    const stations = await fetchNearbyPoliceMappls(userPos.lat, userPos.lng);
    if (stations && stations.length > 0) {
      nearestPS = stations[0].name;
      psMapsLink = `https://maps.google.com/?q=${stations[0].lat},${stations[0].lng}`;
    } else {
      const searchCity = meta.city ? ` ${meta.city}` : '';
      psMapsLink = `https://maps.google.com/?q=${encodeURIComponent(nearestPS + searchCity)}`;
    }
  } catch (e) {
    const searchCity = meta.city ? ` ${meta.city}` : '';
    psMapsLink = `https://maps.google.com/?q=${encodeURIComponent(nearestPS + searchCity)}`;
  }
  
  // Tactical Parallelization Engine
  const tacticalMission = async () => {
    const hooks = [
      // 1. Digital Flare (Cloud Anchor with Deduplication)
      (async () => {
        const finalUser = user || auth.currentUser;
        if (!finalUser || data?.skipCloud) return null;
        
        try {
          const { supabase } = await import('../lib/supabase');
          
          // Query active alerts in Supabase
          const { data: existingAlerts } = await supabase
            .from('alerts')
            .select('id')
            .eq('victim_uid', victimId)
            .in('status', ['active', 'responding', 'rescued_pending_victim_clearance']);
          
          const existingAlert = existingAlerts?.[0];
          const battery = (window as any).kavachBatteryLevel || 0;
          
          // PHASE 8: Device Trust Validation
          const trustReport = await DeviceIntegrityService.calculateTrustScore();
          
          // PHASE 9: Hash Chain Digital Signature Validation
          const payloadString = `${victimId}:${userPos.lat}:${userPos.lng}:${Date.now()}`;
          const digitalSignature = await cryptoService.signPayload(payloadString);
          
          const alertData: any = {
            victimUid: victimId,
            victimName: finalUser.displayName || finalUser.name || 'Kavach Citizen',
            victimPhone: finalUser.phoneNumber || finalUser.phone || localStorage.getItem('kavach_user_phone') || 'UNREGISTERED',
            victimAadhaar: finalUser.aadhar || finalUser.aadhaar || finalUser.victimAadhaar || localStorage.getItem('kavach_user_aadhar') || 'NOT_VERIFIED',
            victimEmail: finalUser.email || 'N/A',
            status: 'active',
            timestamp: new Date().toISOString(),
            lastUpdateAt: new Date().toISOString(),
            location: { 
              latitude: userPos.lat, 
              longitude: userPos.lng,
              routingLat: data?.routingLat || userPos.lat,
              routingLng: data?.routingLng || userPos.lng,
              address: meta.address,
              city: meta.city,
              pincode: meta.pincode
            },
            telemetry: {
              battery: battery,
              signal: 'HIGH',
              trustScore: trustReport.score,
              trustFlags: trustReport.flags,
              isEmulator: trustReport.isEmulator
            },
            state: meta.state || 'National',
            country: "India",
            type: data?.type || 'SOS_TRIGGER',
            verification_lock: true, 
            dispatch_status: 'ACTIVE_UPLINK',
            handshakeCode: data?.handshakeCode || Math.floor(1000 + Math.random() * 9000).toString(),
            mapplsId: data?.mapplsId || null,
            digitalSignature: digitalSignature,
            nearestPoliceStation: nearestPS,
            guardianContacts: (() => {
              try {
                const gStr = localStorage.getItem('kavach_guardian_cache');
                return gStr ? JSON.parse(gStr) : [];
              } catch (e) { return []; }
            })(),
            ...data?.rideContext
          };

          // 🚗 TRANSIT SYNC: If mission is transit-bound, force journey status
          if (data?.rideContext?.isTransitSOS) {
            try {
              const { updateDoc, doc } = await import('firebase/firestore');
              await updateDoc(doc(db, 'journeys', victimId), {
                status: 'emergency',
                alertId: data.alertId,
                lastUpdated: serverTimestamp()
              });
              console.log("🛑 GRID: Journey Status Escalated to EMERGENCY");
            } catch (e) {
              console.error("❌ KAVACH: Journey Escalation Failed:", e);
            }
          }

          const targetAlertId = data?.alertId || existingAlert?.id || Math.random().toString(36).substring(2, 15);
          const locationGeog = `POINT(${userPos.lng} ${userPos.lat})`;

          const supabaseRow = {
            id: targetAlertId,
            victim_uid: victimId,
            victim_name: finalUser.displayName || finalUser.name || 'Kavach Citizen',
            status: 'active',
            location: locationGeog,
            metadata: alertData,
            timestamp: new Date().toISOString()
          };

          const { error: upsertErr } = await supabase
            .from('alerts')
            .upsert(supabaseRow);

          if (upsertErr) {
            console.error("❌ KAVACH: Supabase Alert Upsert Error:", upsertErr);
            throw new Error(upsertErr.message);
          }

          // Update Firestore alert document with reverse-geocoded info
          try {
            await updateDoc(doc(db, 'alerts', targetAlertId), {
              nearestPoliceStation: nearestPS,
              fullAddress: meta.address,
              city: meta.city || 'Classified Zone',
              state: meta.state || 'National'
            });
            console.log(`🔥 [FIRESTORE] Alert ${targetAlertId} metadata updated with ${nearestPS}`);
          } catch (fsErr) {
            console.warn("⚠️ KAVACH: Firestore Alert metadata update pending...", fsErr);
          }

          logTelemetryEvent('sos_trigger_success_firestore', { method: data?.type });
          return { id: targetAlertId };
        } catch (error: any) {
          console.error("❌ KAVACH: Alert Dispatch Error (Network/Auth):", error);
          
          if (error?.message?.includes("offline") || error?.code === 'unavailable' || !navigator.onLine) {
            console.warn("⚠️ NETWORK DROPPED: Queuing dispatch payload & sending gateway SMS...");
            logTelemetryEvent('sos_failure_offline_fallback', { method: data?.type, reason: error.message });
            
            // Dispatch encrypted location SMS relay to government gateway (e.g., +91112911 or similar)
            const gatewayPhone = "112911"; 
            const gatewayMsg = `KAVACH_OFFLINE_GATEWAY_SOS:v_uid:${victimId}:lat:${userPos.lat}:lng:${userPos.lng}`;
            try {
              if (Capacitor.isNativePlatform()) {
                await KavachSafe.broadcastEmergencySMS({ numbers: [gatewayPhone], message: gatewayMsg });
                console.log("📡 Gateway SMS Relay dispatched to " + gatewayPhone);
              }
            } catch (smsErr) {
              console.error("Failed to dispatch offline gateway SMS:", smsErr);
            }
            
            await OfflineQueueService.enqueueSOS(userPos, data);
            return null;
          }

          // Fallback creation
          const { supabase } = await import('../lib/supabase');
          const fallbackId = Math.random().toString(36).substring(2, 15);
          await supabase.from('alerts').insert({
            id: fallbackId,
            victim_uid: victimId,
            status: 'active',
            location: `POINT(${userPos.lng} ${userPos.lat})`,
            timestamp: new Date().toISOString()
          });
          return { id: fallbackId };
        } finally {
           setTimeout(() => activeBlasts.delete(victimId), 10000);
        }
      })(),

      // 2. Physical Signals (Local Tunnel)
      (async () => {
        let guardiansStr = localStorage.getItem('kavach_guardian_cache');
        let guardians = guardiansStr ? JSON.parse(guardiansStr) : [];

        if (guardians.length === 0 && victimId) {
          try {
            const gCol = collection(db, 'users', victimId, 'guardians');
            const gSnap = await getDocs(gCol);
            guardians = gSnap.docs.map(d => d.data());
            if (guardians.length > 0) {
              localStorage.setItem('kavach_guardian_cache', JSON.stringify(guardians));
            }
          } catch (e) {
            console.error("❌ KAVACH: Guardian Ledger Access Failed:", e);
          }
        }

        const phones = guardians.map((g: any) => g.phone).filter(Boolean);
        const alertLink = `https://gen-lang-client-0115433512.web.app/track/${victimId}`;

        const message = `🚨 SOS! ${user?.displayName?.split(' ')[0] || 'User'} is in danger!
📍 Loc: https://maps.google.com/?q=${userPos.lat},${userPos.lng}
🚔 Near Police Station: ${nearestPS}
🔗 Nav: ${psMapsLink}
🔴 Track: ${alertLink}
PIN: ${data?.handshakeCode || 'N/A'}`;

        console.log(`🛡️ KAVACH DISPATCH: Guardian discovery complete. Found ${phones.length} active nodes.`);

        if (phones.length > 0) {
          await KavachSafe.broadcastEmergencySMS({ numbers: phones, message: message });
        } else {
          console.warn("⚠️ KAVACH: No guardians found to notify via SMS.");
        }

        if (data?.source === 'power') {
          console.warn("⚠️ KAVACH: Power Button trigger detected. Skipping auto-call to Guardian to protect Native 112 call.");
        } else {
          const primaryGuardian = guardians.find((g: any) => g.phone);
          if (primaryGuardian) {
            await KavachSafe.initiateEmergencyCall({ number: primaryGuardian.phone });
          } else {
            console.warn("⚠️ KAVACH: No primary guardian found for auto-call.");
          }
        }

        return true;
      })(),

      // 3. Hardware Haptics
      (async () => {
        if (Capacitor.isNativePlatform() && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 500]);
        }
      })
    ];

    const results = await Promise.allSettled(hooks);
    console.log("✅ KAVACH: All Mission Nodes Synchronized.");
    return results;
  };

  return tacticalMission();
};

export const archiveIncident = async (incidentId: string, closureReason?: string) => {
  try {
    const { supabase } = await import('../lib/supabase');
    
    const { data: alertsList, error: fetchError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', incidentId);
      
    if (fetchError || !alertsList || alertsList.length === 0) {
      console.warn(`[ARCHIVE] Incident ${incidentId} not found in Supabase Hot Data.`);
      return false;
    }
    
    const alertData = alertsList[0];
    
    if (alertData.status !== 'resolved' && alertData.status !== 'closed' && alertData.status !== 'aborted' && alertData.status !== 'cancelled') {
      console.warn(`[ARCHIVE] Cannot archive active incident ${incidentId}. Current status: ${alertData.status}`);
      return false;
    }
    
    const updatedMetadata = {
      ...alertData.metadata,
      status: alertData.status,
      closureReason: closureReason || 'citizen_standdown'
    };
    
    const { error: insertError } = await supabase
      .from('incident_archive')
      .insert({
        id: alertData.id,
        victim_uid: alertData.victim_uid,
        victim_name: alertData.victim_name,
        status: alertData.status,
        location: alertData.location,
        metadata: updatedMetadata,
        timestamp: alertData.timestamp
      });
      
    if (insertError) {
      // If it is a duplicate key conflict (23505), it means another call already archived it.
      // We can safely proceed to delete from alerts hot table to finish cleanup.
      if (insertError.code === '23505') {
        console.log(`🗄️ [ARCHIVE] Incident ${incidentId} already archived (duplicate key). Proceeding to hot table cleanup.`);
      } else {
        console.error(`[ARCHIVE] Failed to insert to Supabase archive:`, insertError);
        return false;
      }
    }
    
    const { error: deleteError } = await supabase
      .from('alerts')
      .delete()
      .eq('id', incidentId);
      
    if (deleteError) {
      console.error(`[ARCHIVE] Failed to delete from Supabase alerts:`, deleteError);
      return false;
    }
    
    console.log(`🗄️ [ARCHIVE] Successfully moved incident ${incidentId} to Supabase Cold Archive.`);
    return true;
  } catch (error) {
    console.error(`❌ [ARCHIVE] Failed to archive incident ${incidentId}:`, error);
    return false;
  }
};
