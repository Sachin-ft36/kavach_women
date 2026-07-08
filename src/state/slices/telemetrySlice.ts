import { StateCreator } from 'zustand';
import { KavachState } from './types';

export const createTelemetrySlice: StateCreator<KavachState, [], [], Pick<KavachState, 'blackBox' | 'logIncidentToBlackBox' | 'clearBlackBox'>> = (set, get) => ({
  blackBox: JSON.parse(localStorage.getItem('kavach_blackbox') || '[]'),

  logIncidentToBlackBox: (data) => set((state) => {
    import('../../services/TelemetryBatcher').then(({ telemetryBatcher }) => {
      telemetryBatcher.log({ type: 'blackbox', message: 'Telemetry ping', ...data });
    });

    const updated = [...state.blackBox, { ...data, localTimestamp: Date.now() }].slice(-50);
    localStorage.setItem('kavach_blackbox', JSON.stringify(updated));
    return { blackBox: updated };
  }),

  clearBlackBox: () => {
    localStorage.removeItem('kavach_blackbox');
    set({ blackBox: [] });
  }
});
