import { StateCreator } from 'zustand';
import { KavachState } from './types';

export const createProtectorSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'verifiedProtectorCount' | 'respondingToAlertId' | 'activeProtectorAlertId' | 'isHubReady' | 'setActiveProtectorAlert' | 'setHubReady'>> = (set, get) => ({
  verifiedProtectorCount: 0,
  respondingToAlertId: null,
  activeProtectorAlertId: null,
  isHubReady: false,

  setActiveProtectorAlert: (id) => set({ activeProtectorAlertId: id }),
  setHubReady: (ready) => set({ isHubReady: ready })
});
