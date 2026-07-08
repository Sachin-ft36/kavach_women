import { StateCreator } from 'zustand';
import { KavachState } from './types';
import { toast } from 'sonner';

const savedRideMode = localStorage.getItem('kavach_ride_mode_active') === 'true';
const savedRideData = JSON.parse(localStorage.getItem('kavach_ride_data') || 'null');

export const createRideSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'isRideModeActive' | 'rideData' | 'isRideDeviationAlertActive' | 'rideDeviationType' | 'rideGracePeriodEndsAt' | 'setIsRideDeviationAlertActive' | 'setRideGracePeriodEndsAt' | 'setRideMode' | 'updateRideData'>> = (set, get) => ({
  isRideModeActive: savedRideMode,
  rideData: savedRideData,
  isRideDeviationAlertActive: false,
  rideDeviationType: null,
  rideGracePeriodEndsAt: null,

  setIsRideDeviationAlertActive: (active, type = null) => set({ isRideDeviationAlertActive: active, rideDeviationType: type }),
  
  setRideGracePeriodEndsAt: (time) => set({ rideGracePeriodEndsAt: time }),

  setRideMode: async (isRideModeActive, rideData = null) => {
    if (isRideModeActive) {
      const state = get();
      const isAdmin = state.user?.email === 'singh.sachin16559@gmail.com';
      const isAuthorized = isAdmin || (state.isRegistered && state.isHardwareSynced && state.isVerified);
      if (!isAuthorized) {
        const { toast } = await import('sonner');
        toast.error("Access Denied", {
          description: "Your account must be registered and approved by the Command Center before using Ride Safe.",
          className: "bg-red-950 border-red-500 text-white font-black"
        });
        return;
      }
    }
    localStorage.setItem('kavach_ride_mode_active', isRideModeActive.toString());
    if (rideData) localStorage.setItem('kavach_ride_data', JSON.stringify({ ...rideData, path: [] }));
    else if (!isRideModeActive) localStorage.removeItem('kavach_ride_data');
    set({ isRideModeActive, rideData: rideData ? { ...rideData, path: [] } : null });

    const { auth, db } = await import('../../firebase');
    const { doc, setDoc, deleteDoc, serverTimestamp, updateDoc } = await import('firebase/firestore');
    if (auth.currentUser) {
      const journeyRef = doc(db, 'journeys', auth.currentUser.uid);
      const state = get();
      if (isRideModeActive && rideData) {
        localStorage.setItem('kavach_ride_active', 'true');
        console.log("📡 KAVACH: Initiating National Transit Uplink...");
        try {
          await setDoc(journeyRef, {
            ...rideData,
            latitude: state.userPos.lat,
            longitude: state.userPos.lng,
            path: [{ lng: state.userPos.lng, lat: state.userPos.lat }],
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Kavach User',
            timestamp: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            heartbeat: serverTimestamp()
          });
          console.log("✅ KAVACH: Transit Uplink Established. Sector Monitoring Active.");
        } catch (error) {
          console.error("❌ KAVACH: Transit Uplink Failed:", error);
          const { toast } = await import('sonner');
          toast.error("National Grid Connection Failed.", {
            description: `Telemetry Sync Blocked: ${error instanceof Error ? error.message : 'Unknown Rule Block'}. Check Security Rules.`,
            className: "bg-red-950 border-red-500 text-white font-black"
          });
        }
      } else {
        localStorage.removeItem('kavach_ride_active');
        if (!state.isSOSActive) {
          await updateDoc(journeyRef, {
            status: 'completed',
            endedAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          }).catch(async () => {
            await deleteDoc(journeyRef).catch(() => { });
          });
        }
      }
    }
  },

  updateRideData: async (updates) => {
    const currentState = get();
    const newData = currentState.rideData ? { ...currentState.rideData, ...updates } : null;
    if (newData) localStorage.setItem('kavach_ride_data', JSON.stringify(newData));
    set({ rideData: newData });

    const { auth, db } = await import('../../firebase');
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    if (auth.currentUser && newData) {
      await updateDoc(doc(db, 'journeys', auth.currentUser.uid), {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    }
  }
});
