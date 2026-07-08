import { create } from 'zustand';

export type ProtectionState = 'READY' | 'MONITORING' | 'PROTECTING' | 'EMERGENCY' | 'RECOVERY';
export type RiskState = 'EXCELLENT' | 'GOOD' | 'REDUCED' | 'CRITICAL';

interface ProtectionUIState {
  protectionState: ProtectionState;
  riskState: RiskState;
  protectionIndex: number; // 0 - 100
  recentEventIds: string[];
  setProtectionState: (state: ProtectionState) => void;
  setRiskState: (risk: RiskState) => void;
  setProtectionIndex: (index: number) => void;
  addEventId: (eventId: string) => void;
}

export const useProtectionStore = create<ProtectionUIState>((set) => ({
  protectionState: 'READY',
  riskState: 'EXCELLENT',
  protectionIndex: 80,
  recentEventIds: [],
  setProtectionState: (protectionState) => set({ protectionState }),
  setRiskState: (riskState) => set({ riskState }),
  setProtectionIndex: (protectionIndex) => set({ protectionIndex }),
  addEventId: (eventId) => set((state) => ({
    recentEventIds: [eventId, ...state.recentEventIds].slice(0, 50),
  })),
}));
