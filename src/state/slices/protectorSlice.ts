import { StateCreator } from 'zustand';
import { KavachState } from './types';

export const createProtectorSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'verifiedProtectorCount' | 'respondingToAlertId' | 'activeProtectorAlertId' | 'isHubReady' | 'activeAlertsCount' | 'setActiveProtectorAlert' | 'setHubReady' | 'setActiveAlertsCount'>> = (set, get) => ({
  verifiedProtectorCount: 0,
  respondingToAlertId: null,
  activeProtectorAlertId: null,
  isHubReady: false,
  activeAlertsCount: 0,

  setActiveProtectorAlert: (id) => set({ activeProtectorAlertId: id }),
  setHubReady: (ready) => set({ isHubReady: ready }),
  setActiveAlertsCount: (count) => set({ activeAlertsCount: count })
});
