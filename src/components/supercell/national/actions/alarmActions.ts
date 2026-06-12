import { updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'sonner';
import { handlePcrDispatchAction } from './pcrActions';

export const handleBroadcastAlarmAction = (
  simulatedPcrVans: any[], pcrDispatched: Record<string, boolean>,
  activeAlerts: any[], selectedAlertId: string | null, incidentData: any,
  setPcrDispatched: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void,
  setCustomLogs: (updater: (prev: string[]) => string[]) => void
) => {
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.8;
    audio.play();
  } catch (e) {}

  simulatedPcrVans.forEach(pcr => {
    if (!pcrDispatched[pcr.id]) {
      handlePcrDispatchAction(
        pcr.id, pcr.name, pcr.isReal, pcr.uid,
        selectedAlertId, activeAlerts, incidentData,
        setPcrDispatched, setCustomLogs
      );
    }
  });
  toast.success("🚨 GLOBAL ALARM BROADCASTED TO ALL NEARBY PCOs!");
};

export const handleRadioCallAction = (
  pcrId: string, pcrName: string, activePcoRadio: string | null,
  setActivePcoRadio: (id: string | null) => void,
  setCustomLogs: (updater: (prev: string[]) => string[]) => void
) => {
  if (activePcoRadio === pcrId) {
    setActivePcoRadio(null);
    toast.error(`Radio link with ${pcrName} terminated.`);
  } else {
    setActivePcoRadio(pcrId);
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {}
    
    setCustomLogs(prev => [
      `[${new Date().toLocaleTimeString()}] RADIO LINK: Secure voice channel established with ${pcrName}.`,
      ...prev
    ]);
    toast.success(`Secure radio link established with ${pcrName}. Mic is LIVE.`);
  }
};

export const handleToggleRemoteSirenAction = async (
  alertId: string,
  setCustomLogs: (updater: (prev: string[]) => string[]) => void
) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    const alertDoc = await getDoc(alertRef);
    if (alertDoc.exists()) {
      const currentSirenState = alertDoc.data().remoteSirenTriggered || false;
      const nextState = !currentSirenState;
      
      await updateDoc(alertRef, {
        remoteSirenTriggered: nextState, lastUpdated: serverTimestamp()
      });

      const timestamp = new Date().toLocaleTimeString();
      setCustomLogs(prev => [
        `[${timestamp}] ACOUSTIC INTERCEPT: Remote mobile high-decibel siren command broadcasted to victim device. Status → ${nextState ? 'ENGAGED' : 'SILENCED'}.`,
        ...prev
      ]);
      
      if (nextState) {
        toast.success("🔊 REMOTE SIREN ENGAGED: Victim's phone is now playing a high-volume emergency beacon!");
      } else {
        toast.info("🔊 Remote mobile siren silenced.");
      }
    }
  } catch (e) {
    console.error(e);
    toast.error("Failed to trigger remote siren.");
  }
};
