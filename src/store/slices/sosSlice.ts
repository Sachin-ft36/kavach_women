import { StateCreator } from 'zustand';
import { KavachState } from './types';
import { toast } from 'sonner';
import { auth, logTelemetryEvent } from '../../firebase';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../../services/KavachNative';
import { executeEmergencyBlast, archiveIncident } from '../../services/sosService';

const savedSOS = localStorage.getItem('kavach_sos_active') === 'true';
const savedAlertId = localStorage.getItem('kavach_active_alert_id');
const savedMethod = localStorage.getItem('kavach_trigger_method') as any;
const savedHandshake = localStorage.getItem('kavach_handshake_code');

export const createSOSSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'isSOSActive' | 'triggerMethod' | 'activeAlertId' | 'falseSOSCount' | 'isSOSBlocked' | 'sosBlockedReason' | 'isPermanentlyBlocked' | 'sosStrikeCount' | 'hasPendingWarning' | 'warningMessage' | 'handshakeCode' | 'isHandshakeVerified' | 'isEmergencyOverrideRequested' | 'isDuressTriggered' | 'pendingSOS' | 'deadManSwitchActive' | 'deadManSwitchTriggerTime' | 'setSOSBlocked' | 'setStrikeCount' | 'acknowledgeWarning' | 'requestEmergencyOverride' | 'triggerDuress' | 'setPendingSOS' | 'cancelPendingSOS' | 'startDeadManSwitch' | 'cancelDeadManSwitch' | 'checkDeadManSwitch' | 'setSOSActive'>> = (set, get) => ({
  isSOSActive: savedSOS,
  triggerMethod: savedMethod || 'button',
  activeAlertId: savedAlertId,
  falseSOSCount: 0,
  isSOSBlocked: false,
  sosBlockedReason: null,
  isPermanentlyBlocked: false,
  sosStrikeCount: 0,
  hasPendingWarning: false,
  warningMessage: null,
  handshakeCode: savedHandshake,
  isHandshakeVerified: false,
  isEmergencyOverrideRequested: false,
  isDuressTriggered: false,
  pendingSOS: null,
  deadManSwitchActive: false,
  deadManSwitchTriggerTime: null,

  setSOSBlocked: (blocked, reason = null) => set({ isSOSBlocked: blocked, sosBlockedReason: reason }),
  setStrikeCount: (count) => set({ sosStrikeCount: count }),

  acknowledgeWarning: async () => {
    try {
      const { auth, db } = await import('../../firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          hasPendingWarning: false,
          warningMessage: null
        });
        set({ hasPendingWarning: false, warningMessage: null });
        toast.success("Warning Acknowledged", {
          description: "Please ensure responsible use of the SOS system.",
        });
      }
    } catch (error) {
      toast.error("Failed to acknowledge warning");
    }
  },

  requestEmergencyOverride: async () => {
    try {
      set({ isEmergencyOverrideRequested: true });
      setTimeout(() => {
        set({ isEmergencyOverrideRequested: false });
      }, 300000);
      toast.success("Emergency Override Requested", {
        description: "Your request has been prioritized for immediate human review.",
        className: "bg-orange-500 text-white"
      });
    } catch (e) {
      toast.error("Override request failed");
    }
  },

  triggerDuress: async (distressCode: string) => {
    set({ isDuressTriggered: true, isHandshakeVerified: true });
    toast.error("DURESS PROTOCOL ACTIVATED", {
      description: "App appearing normal. Silent uplink established.",
      className: "bg-red-900 border-red-500 text-red-100"
    });
    
    if (Capacitor.isNativePlatform()) {
      try {
        await KavachSafe.setAppStealthMode({ enabled: true });
      } catch (e) { }
    }
    
    return true;
  },

  startDeadManSwitch: (targetTimestamp: number) => {
    set({ deadManSwitchActive: true, deadManSwitchTriggerTime: targetTimestamp });
    console.log(`⏱️ DEAD MAN SWITCH ARMED for: ${new Date(targetTimestamp).toLocaleTimeString()}`);
  },

  cancelDeadManSwitch: () => {
    set({ deadManSwitchActive: false, deadManSwitchTriggerTime: null });
    console.log('✅ DEAD MAN SWITCH DISARMED');
  },

  checkDeadManSwitch: () => {
    const { deadManSwitchActive, deadManSwitchTriggerTime, setSOSActive } = get();
    if (deadManSwitchActive && deadManSwitchTriggerTime && Date.now() >= deadManSwitchTriggerTime) {
      console.warn('🚨 DEAD MAN SWITCH TRIGGERED! ETA EXPIRED WITHOUT ACKNOWLEDGEMENT.');
      get().cancelDeadManSwitch();
      setSOSActive(true, null, 'silent');
    }
  },

  setPendingSOS: (active, method = 'button') => {
    if (active) {
      const state = get();
      const isAdmin = state.user?.email === 'singh.sachin16559@gmail.com';
      const isAuthorized = isAdmin || (state.isRegistered && state.isHardwareSynced && state.isVerified);
      if (!isAuthorized) {
        console.warn("🛡️ KAVACH GUARD: SOS Trigger blocked. Profile must be registered, synced, and approved by the Command Center.");
        return;
      }
      set({
        pendingSOS: {
          active: true,
          method,
          expiresAt: Date.now() + (method === 'power' ? 10000 : 5000)
        }
      });
    } else {
      set({ pendingSOS: null });
    }
  },

  cancelPendingSOS: () => {
    set({ pendingSOS: null });
    KavachSafe.stopContinuousSiren().catch(() => { });
    toast.info("SOS Request Cancelled", {
      description: "False trigger avoided. System returning to standby.",
      icon: '🛡️'
    });
  },

  setSOSActive: async (isSOSActive, activeAlertId = null, method = 'button', closureReason = null, providedHandshake = null) => {
    const wasAlreadyActive = get().isSOSActive;
    const { userPos } = get();

    if (isSOSActive) {
      const state = get();
      const isAdmin = state.role === 'admin' || state.role === 'super_cell';
      const isAuthorized = isAdmin || (state.isRegistered && state.isHardwareSynced && state.isVerified);
      if (!isAuthorized) {
        console.warn("🛡️ KAVACH GUARD: SOS activation blocked. Profile must be registered, synced, and approved by the Command Center.");
        return;
      }

      const currentUid = auth.currentUser?.uid || localStorage.getItem('kavach_user_uid');

      if (!currentUid) {
        toast.error("Tactical Identity Failure. Please re-authenticate.");
        return;
      }

      const lastCancel = localStorage.getItem('kavach_last_cancellation_time');
      const isOverride = (method === 'duress' || (window as any)._kavach_sos_override === true);
      
      if (lastCancel && !isOverride) {
        const timeSinceCancel = Date.now() - parseInt(lastCancel, 10);
        if (timeSinceCancel < 30 * 60 * 1000) { // 30 minutes
          const cooldownKey = `kavach_sos_cooldown_${currentUid}`;
          localStorage.setItem(cooldownKey, lastCancel);
          console.warn("🛡️ KAVACH GUARD: SOS activation blocked due to cool down restriction.");
          set({ pendingSOS: null });
          return;
        }
      }

      // 🎯 Bypassed all strike systems completely. Allowing instant SOS triggers.
      console.log(`🚨 KAVACH COMMAND: SOS TRIGGERED VIA [${method.toUpperCase()}]`);
      logTelemetryEvent('sos_trigger_success', { method });

      const freshAlertId = `alert_${currentUid}_${Date.now()}`;
      const alertId = freshAlertId;
      const existingHandshake = providedHandshake || get().handshakeCode || localStorage.getItem('kavach_handshake_code');
      const finalHandshake = existingHandshake || Math.floor(1000 + Math.random() * 9000).toString();

      if (Capacitor.isNativePlatform()) {
        try {
          await KavachSafe.requestSensitivePermissions();
        } catch (e) {
          console.warn("⚠️ KAVACH: Permission escalation failed.");
        }
      }

      const isTransit = !!state.isRideModeActive;
      const rideContext = isTransit ? {
        isTransitSOS: true,
        vehicleNo: state.rideData?.vehicleNo || 'UNKNOWN',
        journeyId: auth.currentUser?.uid,
        transitStatus: 'INTERCEPTION_REQUIRED'
      } : {};

      if (isTransit && state.rideData) {
        const updatedRide = { ...state.rideData, status: 'emergency' as const };
        set({
          isSOSActive: true,
          activeAlertId: alertId,
          triggerMethod: method,
          pendingSOS: null,
          isHandshakeVerified: false,
          handshakeCode: finalHandshake,
          activeTab: 'sos',
          rideData: updatedRide,
          isRideDeviationAlertActive: false
        });
        localStorage.setItem('kavach_ride_data', JSON.stringify(updatedRide));
      } else {
        set({
          isSOSActive: true,
          activeAlertId: alertId,
          triggerMethod: method,
          pendingSOS: null,
          isHandshakeVerified: false,
          handshakeCode: finalHandshake,
          activeTab: 'sos',
          isRideDeviationAlertActive: false
        });
      }

      localStorage.setItem('kavach_sos_active', 'true');
      localStorage.setItem('kavach_trigger_method', method);
      localStorage.setItem('kavach_active_alert_id', alertId);
      localStorage.setItem('kavach_handshake_code', finalHandshake);
      localStorage.setItem('kavach_last_trigger_time', Date.now().toString());

      if (!wasAlreadyActive) {
        set({ isShadowActive: true });
        
        KavachSafe.startForensicCapture().catch(e => console.warn("Native forensics not available:", e));

        try {
          // 📡 Initialize Firestore Alert Document
          const { db } = await import('../../firebase');
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const finalUser = (get().user || auth.currentUser) as any;
          await setDoc(doc(db, 'alerts', alertId), {
            id: alertId,
            victimUid: currentUid,
            victimName: finalUser?.displayName || finalUser?.name || 'Kavach Citizen',
            victimPhone: finalUser?.phoneNumber || finalUser?.phone || localStorage.getItem('kavach_user_phone') || 'UNREGISTERED',
            status: 'active',
            createdAt: serverTimestamp(),
            timestamp: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            type: method,
            schemaVersion: 1,
            latitude: userPos?.lat || 20.5937,
            longitude: userPos?.lng || 78.9629,
            location: {
              latitude: userPos?.lat || 20.5937,
              longitude: userPos?.lng || 78.9629,
            }
          });
          console.log(`🔥 [FIRESTORE] Alert document ${alertId} initialized as active`);
        } catch (fsErr) {
          console.error("❌ [FIRESTORE] Failed to initialize alert document:", fsErr);
        }

        try {
          await executeEmergencyBlast(get().user || auth.currentUser, userPos, {
            alertId: alertId,
            type: method,
            mapplsId: null,
            routingLat: userPos.lat,
            routingLng: userPos.lng,
            rideContext: rideContext
          });

          if (method !== 'silent' && method !== 'duress' && Capacitor.isNativePlatform()) {
             await KavachSafe.startContinuousSiren();
          }

        } catch (error) {
           console.error("SOS Blast execution failed:", error);
        }
      }

    } else {
      localStorage.removeItem('kavach_sos_active');
      localStorage.removeItem('kavach_active_alert_id');
      localStorage.removeItem('kavach_trigger_method');
      localStorage.removeItem('kavach_handshake_code');
      localStorage.removeItem('kavach_last_trigger_time');

      localStorage.setItem('kavach_last_cancellation_time', Date.now().toString());
      
      const closedAlertId = get().activeAlertId;

      // ⚡ IMMEDIATE SYNCHRONOUS STATE UPDATE: Switch active tab and turn off active SOS immediately
      set({
        isSOSActive: false,
        activeAlertId: null,
        isHandshakeVerified: false,
        handshakeCode: null,
        isDuressTriggered: false,
        isShadowActive: false,
        activeTab: 'dashboard'
      });

      if (closedAlertId && auth.currentUser) {
         // Run DB calls asynchronously in the background so UI doesn't wait
         (async () => {
           // 📡 Update Firestore Alert Document Status
           try {
             const { db } = await import('../../firebase');
             const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
             await updateDoc(doc(db, 'alerts', closedAlertId), {
               status: 'cancelled',
               closedAt: serverTimestamp(),
               closureReason: closureReason || 'citizen_standdown'
             });
             console.log(`🔥 [FIRESTORE] Successfully updated alert ${closedAlertId} to cancelled`);
           } catch (fsErr) {
             console.warn("⚠️ [FIRESTORE] Failed to update alert status to cancelled in Firestore:", fsErr);
           }

           try {
             const { supabase } = await import('../../lib/supabase');
             
             await supabase
               .from('alerts')
               .update({
                 status: 'cancelled'
               })
               .eq('id', closedAlertId);

             await archiveIncident(closedAlertId, closureReason || 'citizen_standdown');

             const { data: ghosts } = await supabase
               .from('alerts')
               .select('id')
               .eq('victim_uid', auth.currentUser.uid)
               .in('status', ['active', 'responding']);

             if (ghosts && ghosts.length > 0) {
               for (const ghost of ghosts) {
                 if (ghost.id !== closedAlertId) {
                   await supabase
                     .from('alerts')
                     .update({ status: 'cancelled' })
                     .eq('id', ghost.id);
                   await archiveIncident(ghost.id, 'ghost_cleanup');
                 }
               }
             }
           } catch (e) {
             console.error("Failed to archive incident in Supabase:", e);
           }
         })();
      }

      if (Capacitor.isNativePlatform()) {
        try {
           await KavachSafe.stopContinuousSiren();
           await KavachSafe.stopForensicCapture();
           await KavachSafe.setAppStealthMode({ enabled: false });
        } catch (e) { }
      }

      toast.success("Security Standdown", {
        description: "SOS Alert deactivated. All systems returning to normal.",
        icon: '🛡️'
      });
    }
  }
});
