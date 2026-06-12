import { doc, updateDoc, serverTimestamp, getDoc, arrayUnion } from 'firebase/firestore';
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

    const alertDoc = await getDoc(doc(db, 'alerts', alertId));
    if (!alertDoc.exists()) return;

    const alertData = alertDoc.data();
    if (alertData.responderUid && alertData.responderUid !== user.uid) {
      toast.error("🚨 ALERT ALREADY INTERCEPTED! Another PCR unit is already en-route.");
      setIsProcessingResponse(false);
      setShowTacticalPledge({ isOpen: false, alertId: null });
      return;
    }

    const isAlreadyResponding = (alertData.activeResponders || []).some((r: any) => r.uid === user.uid);
    setRespondingToId(alertId);
    setShowTacticalPledge({ isOpen: false, alertId: null });

    try {
      const state = useKavachStore.getState();
      const responderData = {
        uid: user.uid,
        name: state.profile?.name || user.displayName || 'Protector Saathi',
        photo: state.profile?.photoUrl || state.profile?.photoURL || user.photoURL || '',
        phone: state.profile?.phone || user.phoneNumber || '',
        joinedAt: isAlreadyResponding ? (alertData.activeResponders.find((r: any) => r.uid === user.uid)?.joinedAt || Date.now()) : Date.now()
      };

      if (!isAlreadyResponding) {
        await updateDoc(doc(db, 'alerts', alertId), {
          status: 'responding',
          activeResponders: arrayUnion(responderData),
          responderUid: user.uid,
          responderName: state.profile?.name || user.displayName || 'Protector Saathi'
        });

        supabase.from('missions').insert({
          alert_id: alertId.startsWith('alert_') ? undefined : alertId,
          protector_id: user.uid,
          status: 'en_route',
          merit_earned: 0
        }).then(({ error }) => {
          if (error) console.error("⚡ SUPABASE: Mission Sync Failed.", error);
        });
      }

      await updateDoc(doc(db, 'users', user.uid), {
        status: 'responding',
        respondingToAlertId: alertId,
        lastUpdated: serverTimestamp()
      });

      useKavachStore.setState({ respondingToAlertId: alertId });

      const activeAlert = activeAlerts.find(a => a.id === alertId);
      if (activeAlert) {
        useKavachStore.setState({ activeAlertId: alertId });
        setActiveInterceptAlert(activeAlert);
        if (!isCarScreenOpen) setIsInterceptHUDOpen(true);
        setInterceptActive(true);
        setIsNavigating(true);
      }
      toast.success("Grid Connection Stabilized.");
    } catch (error) {
      toast.error("Tactical Uplink Failed.");
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

  const maskName = (name: string) => {
    if (!name || name === 'Kavach Citizen') return name;
    const parts = name.split(' ');
    return parts.map((part: string) => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.min(part.length - 1, 7));
    }).join(' ');
  };

  return { handleStartHelp, confirmTacticalResponse, handleResolveAlert, maskName };
};
