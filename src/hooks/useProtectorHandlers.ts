import { doc, updateDoc, serverTimestamp, getDoc, arrayUnion, runTransaction, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';

export const useProtectorHandlers = (
  user: any,
  isProcessingResponse: boolean,
  setIsProcessingResponse: (val: boolean) => void,
  showTacticalPledge: { isOpen: boolean, alertId: string | null },
  setShowTacticalPledge: (val: { isOpen: boolean, alertId: string | null }) => void,
  setRespondingToId: (id: string | null) => void,
  activeAlerts: any[],
  setActiveInterceptAlert: (alert: any) => void,
  isCarScreenOpen: boolean,
  setIsInterceptHUDOpen: (val: boolean) => void,
  setInterceptActive: (val: boolean) => void,
  setIsNavigating: (val: boolean) => void,
  resolvingAlert: any,
  setResolvingAlert: (val: any) => void,
  handshakeInput: string,
  setHandshakeInput: (val: string) => void,
  resolutionSummary: string,
  setResolutionSummary: (val: string) => void,
  rescuePhoto: string | null,
  setRescuePhoto: (val: string | null) => void
) => {

  const handleStartHelp = (alertId: string) => {
    setShowTacticalPledge({ isOpen: true, alertId });
  };

  const confirmTacticalResponse = async () => {
    if (isProcessingResponse) return;
    const alertId = showTacticalPledge.alertId;
    if (!alertId || !user) return;

    setIsProcessingResponse(true);
    setRespondingToId(alertId);
    setShowTacticalPledge({ isOpen: false, alertId: null });

    // ⚡ OPTIMISTIC UI: Open map/route IMMEDIATELY before any network call
    const activeAlert = activeAlerts.find(a => a.id === alertId);
    if (activeAlert) {
      useKavachStore.setState({ respondingToAlertId: alertId, activeAlertId: alertId });
      setActiveInterceptAlert(activeAlert);
      if (!isCarScreenOpen) setIsInterceptHUDOpen(true);
      setInterceptActive(true);
      setIsNavigating(true);
    }

    try {
      const state = useKavachStore.getState();

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User profile not found.");
      const userData = userSnap.data();

      // 🔒 Workload Capacity Guard
      const activeMissionsCount = userData.activeMissionsCount || 0;
      const maxMissionCapacity = userData.maxMissionCapacity || 1;
      if (activeMissionsCount >= maxMissionCapacity) {
        throw new Error("🚨 Active mission capacity exceeded. Complete pending missions first.");
      }

      // 🔑 Strip base64 from photo — store only URL reference to prevent document size explosion
      const rawPhoto = state.profile?.photoUrl || state.profile?.photoURL || user.photoURL || '';
      const safePhotoRef = rawPhoto.startsWith('data:') ? '' : (rawPhoto.slice(0, 500)); // Max 500 chars for URL

      await runTransaction(db, async (transaction) => {
        const alertRef = doc(db, 'alerts', alertId);
        const alertSnap = await transaction.get(alertRef);

        if (!alertSnap.exists()) throw new Error("Alert does not exist.");

        const alertData = alertSnap.data();

        // 🔒 Check Dispatch Lock to prevent double-writes
        const now = Date.now();
        if (alertData.dispatchLock && alertData.dispatchLockTimestamp && (now - alertData.dispatchLockTimestamp < 5000)) {
          throw new Error("🚨 Dispatch system lock active. Please retry in 5 seconds.");
        }

        const respondersMap = alertData.responders || {};
        const isAlreadyResponding = !!respondersMap[user.uid];

        if (!isAlreadyResponding) {
          // Dynamic Swarm Role Assignment
          const activeRespondersCount = Object.keys(respondersMap).length;
          let assignedRole = 'standby';
          if (activeRespondersCount === 0) assignedRole = 'primary';
          else if (activeRespondersCount === 1) assignedRole = 'backup';
          else if (activeRespondersCount === 2) assignedRole = 'standby';

          // ⚠️ CRITICAL: DO NOT include base64 photo data in Firestore documents
          // Only lightweight responder metadata goes into Firestore
          const responderData = {
            uid: user.uid,
            name: state.profile?.name || user.displayName || 'Protector Saathi',
            photoRef: safePhotoRef, // URL only, never base64
            role: assignedRole,
            joinedAt: now,
            acceptedAt: now,
            freezeLockExpiresAt: now + 30000,
            trustTier: state.profile?.trustTier || 'blue',
            completedMissions: state.profile?.completedMissions || 0,
          };

          const updatedResponders = {
            ...respondersMap,
            [user.uid]: responderData
          };

          transaction.update(alertRef, {
            status: 'responding',
            schemaVersion: 1,
            dispatchLock: true,
            dispatchLockTimestamp: now,
            responderUid: user.uid,
            responderName: (state.profile?.name || user.displayName || 'Protector Saathi').slice(0, 100),
            responders: updatedResponders
          });

          // 📡 Sync updated responder metadata immediately to Supabase Alerts Hot table
          (async () => {
             try {
               const latestAlertSnap = await getDoc(alertRef);
               if (latestAlertSnap.exists()) {
                 const fullAlertData = latestAlertSnap.data();
                 const updatedMetadata = {
                   ...(fullAlertData.metadata || {}),
                   status: 'responding',
                   responderUid: user.uid,
                   responderName: state.profile?.name || user.displayName || 'Protector Saathi',
                   responders: updatedResponders
                 };

                 const payload = {
                   status: 'responding',
                   responder_lat: state.userPos?.lat || null,
                   responder_lng: state.userPos?.lng || null,
                   last_pulse: new Date().toISOString(),
                   metadata: updatedMetadata
                 };
                 await supabase
                   .from('alerts')
                   .update(payload)
                   .eq('id', alertId);
                 console.log("⚡ SUPABASE: Responders mapped successfully on SOS alert document.");
               }
             } catch (sbErr) {
                console.error("❌ SUPABASE: Alert sync failed inside responder confirmation transaction:", sbErr);
             }
          })();

          // Supabase logs (non-blocking)
          supabase.from('missions').insert({
            alert_id: alertId.startsWith('alert_') ? undefined : alertId,
            protector_id: user.uid,
            status: 'en_route',
            merit_earned: 0
          }).then(({ error }) => {
            if (error) console.error("⚡ SUPABASE: Mission Sync Failed.", error);
          });
        }
      });

      toast.success("Grid Connection Stabilized. Navigating to target.");

      // Perform non-blocking updates/syncs in the background
      updateDoc(userRef, {
        status: 'responding',
        respondingToAlertId: alertId,
        activeMissionsCount: increment(1),
        lastUpdated: serverTimestamp()
      }).catch(err => console.error("Failed to update user doc:", err));

    } catch (error: any) {
      console.error("Tactical Uplink Failure:", error);
      // Don't close map on failure — user is already navigating
      if (!error.message?.includes('lock active')) {
        toast.error(error.message || "Tactical Uplink Failed. Continuing offline.");
      }
    } finally {
      setIsProcessingResponse(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!resolvingAlert) return;
    if (handshakeInput !== resolvingAlert.handshakeCode) {
      toast.error("Invalid Tactical Handshake Code. Access Denied.");
      return;
    }
    try {
      const alertRef = doc(db, 'alerts', resolvingAlert.id);
      await updateDoc(alertRef, {
        status: 'rescued_pending_victim_clearance',
        verification: {
          closureReason: resolutionSummary,
          handshakeCode: handshakeInput,
          rescuePhotoUrl: rescuePhoto,
          resolvedAt: serverTimestamp(),
          verifiedBy: user?.uid
        }
      });
      
      // Sync to Supabase alerts table
      try {
        const alertSnap = await getDoc(doc(db, 'alerts', resolvingAlert.id));
        if (alertSnap.exists()) {
          const alertData = alertSnap.data();
          await supabase
            .from('alerts')
            .update({
              status: 'rescued_pending_victim_clearance',
              metadata: {
                ...alertData,
                status: 'rescued_pending_victim_clearance'
              }
            })
            .eq('id', resolvingAlert.id);
        }
      } catch (sbErr) {
        console.error("⚡ SUPABASE: Failed to sync resolved status to alert table.", sbErr);
      }

      toast.success("Verification Uplinked. Awaiting Victim Clearance.");
      setResolvingAlert(null);
      setHandshakeInput('');
      setResolutionSummary('');
      setRescuePhoto(null);
      setRespondingToId(null);
    } catch (e) {
      toast.error("Failed to finalize.");
    }
  };

  const handleAbortResponse = async (alertId: string, reason: string = 'No reason provided') => {
    if (!user || !alertId) return;
    try {
      const { deleteField } = await import('firebase/firestore');
      const alertRef = doc(db, 'alerts', alertId);
      const userRef = doc(db, 'users', user.uid);

      const alertSnap = await getDoc(alertRef);
      const updates: any = {
        [`responders.${user.uid}`]: deleteField(),
        abortReason: reason,
        abortedByUid: user.uid,
        abortedAt: serverTimestamp(),
      };

      if (alertSnap.exists()) {
        const alertData = alertSnap.data();
        if (alertData.responderUid === user.uid) {
          const remainingResponders = Object.keys(alertData.responders || {}).filter(uid => uid !== user.uid);
          if (remainingResponders.length > 0) {
            updates.responderUid = remainingResponders[0];
            updates.responderName = alertData.responders[remainingResponders[0]].name || 'Protector';
          } else {
            updates.responderUid = null;
            updates.responderName = null;
            updates.status = 'active'; // revert to active distress
          }
        }
      }

      await updateDoc(alertRef, updates);

      // Sync to Supabase alerts table
      try {
        const alertSnap = await getDoc(doc(db, 'alerts', alertId));
        if (alertSnap.exists()) {
          const alertData = alertSnap.data();
          await supabase
            .from('alerts')
            .update({
              status: alertData.status,
              metadata: alertData
            })
            .eq('id', alertId);
        }
      } catch (sbErr) {
        console.error("⚡ SUPABASE: Failed to sync abort/status revert to alert table.", sbErr);
      }

      await updateDoc(userRef, {
        status: 'idle',
        respondingToAlertId: null,
        activeMissionsCount: 0,
        lastUpdated: serverTimestamp()
      });

      // Update Supabase
      await supabase.from('missions')
        .update({ status: 'aborted' })
        .match({ protector_id: user.uid, status: 'en_route' });

      // Reset local state
      setRespondingToId(null);
      setActiveInterceptAlert(null);
      setIsInterceptHUDOpen(false);
      setInterceptActive(false);
      setIsNavigating(false);

      toast.info("Tactical stand down confirmed. Mission aborted.");
    } catch (e) {
      console.error("Abort failed:", e);
      toast.error("Failed to abort mission. Please try again.");
    }
  };

  const maskName = (name: string) => {
    if (!name || name === 'Kavach Citizen') return name;
    const parts = name.split(' ');
    return parts.map((part: string) => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.min(part.length - 1, 7));
    }).join(' ');
  };

  return { handleStartHelp, confirmTacticalResponse, handleResolveAlert, handleAbortResponse, maskName };
};
