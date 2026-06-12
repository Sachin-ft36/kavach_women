import { updateDoc, doc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'sonner';

export const triggerStateHighwaySimulationAction = async (
  selectedAlertId: string | null, isSimulatingRun: boolean,
  incidentData: any, setCustomLogs: (updater: (prev: string[]) => string[]) => void
) => {
  const timestamp = new Date().toLocaleTimeString();
  const city = incidentData?.city || 'Local';
  const state = incidentData?.stateName || 'State';
  
  if (selectedAlertId) {
    try {
      await updateDoc(doc(db, 'alerts', selectedAlertId), {
        escapeVectorActive: !isSimulatingRun, nakabandiDeployed: false, lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.warn('Failed to sync escape vector to cloud:', e);
    }
  }

  if (isSimulatingRun) {
    setCustomLogs(prev => [
      `[${timestamp}] Escape vector tracking cancelled. ${city} district boundaries re-stabilized.`,
      ...prev
    ]);
    toast.info('State level escape transit tracking stopped.');
  } else {
    setCustomLogs(prev => [
      `[${timestamp}] WARNING: Target coordinates leaving ${city} district borders. Escape vector active on state highway.`,
      `[${timestamp}] TRANSIT ESCALATION: ${state} State Command HQ notified. Target crossing outer boundary threshold.`,
      ...prev
    ]);
    toast.warning(`Victim escape transit tracked from ${city} towards state border toll gate!`);
  }
};

export const deployHighwayNakabandiAction = async (
  selectedAlertId: string | null, incidentData: any,
  setCustomLogs: (updater: (prev: string[]) => string[]) => void
) => {
  const timestamp = new Date().toLocaleTimeString();
  const city = incidentData?.city || 'Local';
  const state = incidentData?.stateName || 'State';
  
  if (selectedAlertId) {
    try {
      await updateDoc(doc(db, 'alerts', selectedAlertId), {
        nakabandiDeployed: true, tollInterdictTime: serverTimestamp()
      });
    } catch (e) {
      console.warn('Failed to lock NHAI grid in cloud:', e);
    }
  }

  setCustomLogs(prev => [
    `[${timestamp}] STATE NAKABANDI ACTIVATED: ${city} outer toll gate barrier locking engaged.`,
    `[${timestamp}] ${state} highway blockade locked down. Escape route completely masked by ${state} Police Command.`,
    ...prev
  ]);
  toast.success('🚧 HIGHWAY NAKABANDI ENGAGED: Toll gates completely locked down by state police command!');
};

export const handleLegalDispatchAction = async (
  selectedAlertId: string | null, activeAlerts: any[], incidentData: any,
  setIsDispatching: (val: boolean) => void,
  setCustomLogs: (updater: (prev: string[]) => string[]) => void
) => {
  setIsDispatching(true);
  const timestamp = new Date().toLocaleTimeString();
  const caseId = incidentData?.caseId || `ZF-AUTO-${Date.now().toString().slice(-4)}`;
  const victimName = incidentData?.victimName || 'Sovereign Node';
  const city = incidentData?.city || 'Local';
  const state = incidentData?.stateName || 'State';
  const alert = activeAlerts.find(a => a.id === selectedAlertId);

  try {
    await addDoc(collection(db, 'zero_firs'), {
      caseId, victimName, phone: alert?.phone || alert?.victimPhone || 'Force ID: 102',
      city, state, area: alert?.locationName || alert?.address || 'Highway Sector 4',
      dest: `${city} Central Precinct`, status: 'Transit Locked',
      timestamp: serverTimestamp(), createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Firestore Zero FIR creation bypassed:', e);
  }

  setTimeout(() => {
    setIsDispatching(false);
    setCustomLogs(prev => [
      `[${timestamp}] SOVEREIGN COMMAND: Legal distress response packet signed and broadcasted to local magistrate.`,
      ...prev
    ]);
    toast.success("Sovereign distress legal response packet successfully signed and broadcasted!");
  }, 2000);
};
