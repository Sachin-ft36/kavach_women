import { StateCreator } from 'zustand';
import { KavachState } from './types';

const cachedGuardians = JSON.parse(localStorage.getItem('kavach_guardian_cache') || '[]');

export const createSettingsSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'guardianCache' | 'setGuardianCache'>> = (set, get) => ({
  guardianCache: cachedGuardians,

  setGuardianCache: (guardians) => {
    localStorage.setItem('kavach_guardian_cache', JSON.stringify(guardians));
    set({ guardianCache: guardians });
  }
});
