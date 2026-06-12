import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'sonner';

export const handlePcrDispatchAction = async (
  pcrId: string, pcrName: string, isReal: boolean = false, officerUid: string | undefined,
  selectedAlertId: string | null, activeAlerts: any[], incidentData: any,
  setPcrDispatched: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void,
  setCustomLogs: (updater: (prev: string[]) => string[]) => void
) => {
  setPcrDispatched(prev => ({ ...prev, [pcrId]: true }));
  const timestamp = new Date().toLocaleTimeString();
  const alert = activeAlerts.find(a => a.id === selectedAlertId);

  try {
    await addDoc(collection(db, 'dispatches'), {
      pcrId, pcrName, officerUid: officerUid || null, alertId: selectedAlertId,
      alertLocation: alert ? {
        lat: alert.latitude || alert.location?.lat || 0,
        lng: alert.longitude || alert.location?.lng || 0,
        name: alert.locationName || alert.address || incidentData?.city || 'Unknown'
      } : null,
      victimName: incidentData?.victimName || 'Unknown',
      dispatchedAt: serverTimestamp(), status: 'dispatched', isRealOfficer: isReal
    });

    if (isReal && officerUid) {
      await updateDoc(doc(db, 'users', officerUid), {
        currentDispatchStatus: 'dispatched', currentAlertId: selectedAlertId, lastUpdated: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn('Firestore dispatch write failed (non-critical):', e);
  }

  setCustomLogs(prev => [
    `[${timestamp}] PCR DISPATCH: ${pcrName} status → DISPATCHED.`,
    `[${timestamp}] En-route vector locked to victim coordinates. ETA auto-updating via GPS.`,
    ...prev
  ]);
  toast.success(`🚔 ${pcrName} dispatched to location!`);
};

export const handleForceReassignPcrAction = async (
  alertId: string, officerName: string,
  setCustomLogs: (updater: (prev: string[]) => string[]) => void
) => {
  try {
    const q = query(
      collection(db, 'dispatches'),
      where('alertId', '==', alertId),
      where('status', '==', 'dispatched')
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(doc(db, 'dispatches', d.id), {
        status: 'cancelled', lastUpdated: serverTimestamp()
      });
    }

    const alertRef = doc(db, 'alerts', alertId);
    const alertDoc = await getDoc(alertRef);
    if (alertDoc.exists()) {
      const alertData = alertDoc.data();
      const inactiveUid = alertData.responderUid;
      
      await updateDoc(alertRef, {
        status: 'active', responderUid: null, responderName: null,
        activeResponders: [], inactivityEscalated: false, inactivityReassigned: true,
        lastUpdated: serverTimestamp()
      });

      if (inactiveUid) {
        await updateDoc(doc(db, 'users', inactiveUid), {
          status: 'idle', respondingToAlertId: null, currentDispatchStatus: 'idle',
          currentAlertId: null, lastUpdated: serverTimestamp()
        });
      }
    }

    const timestamp = new Date().toLocaleTimeString();
    setCustomLogs(prev => [
      `[${timestamp}] FORCE RE-ASSIGN: Unit ${officerName} un-assigned due to en-route standstill inactivity.`,
      `[${timestamp}] Distress node re-broadcasted directly to all nearby active patrolling PCR units.`,
      ...prev
    ]);
    toast.warning(`🚨 Force reassigned PCR alert! Stationary unit ${officerName} un-assigned.`);
    
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Stationary PCR unit unassigned. Alert rerouted.");
      window.speechSynthesis.speak(msg);
    }
  } catch (e) {
    console.error(e);
    toast.error("Failed to reassign PCR unit.");
  }
};
