import { StateCreator } from 'zustand';
import { KavachState } from './types';

export const createUISlice: StateCreator<KavachState, [], [], Pick<KavachState, 'activeTab' | 'loading' | 'isGhostMode' | 'isShadowActive' | 'isBriefingActive' | 'isInterceptActive' | 'isOverlayActive' | 'isAIChatOpen' | 'isCameraActive' | 'activeRadius' | 'isFirFlowActive' | 'isSafeTimerAlertActive' | 'pendingNavigationTarget' | 'isFakeCallActive' | 'isVoiceTriggerActive' | 'setActiveTab' | 'setLoading' | 'setShadowActive' | 'setBriefingActive' | 'setInterceptActive' | 'setOverlayActive' | 'setIsAIChatOpen' | 'setIsCameraActive' | 'setActiveRadius' | 'setIsFirFlowActive' | 'setIsSafeTimerAlertActive' | 'setPendingNavigationTarget' | 'setFakeCallActive' | 'setVoiceTriggerActive'>> = (set, get) => ({
  activeTab: 'dashboard',
  loading: true,
  isGhostMode: false,
  isShadowActive: false, // will be properly initialized in useKavachStore.ts after combining
  isBriefingActive: false,
  isInterceptActive: false,
  isOverlayActive: false,
  isAIChatOpen: false,
  isCameraActive: false,
  activeRadius: 2.0,
  isFirFlowActive: false,
  isSafeTimerAlertActive: false,
  pendingNavigationTarget: null,
  isFakeCallActive: false,
  isVoiceTriggerActive: localStorage.getItem('kavach_voice_trigger') !== 'false',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ loading }),
  setShadowActive: (active) => set({ isShadowActive: active }),
  setBriefingActive: (active) => set({ isBriefingActive: active }),
  setInterceptActive: (active) => set({ isInterceptActive: active }),
  setOverlayActive: (active) => set({ isOverlayActive: active }),
  setIsAIChatOpen: (active) => set({ isAIChatOpen: active }),
  setIsCameraActive: (active) => set({ isCameraActive: active }),
  setActiveRadius: (radius) => set({ activeRadius: radius }),
  setIsFirFlowActive: (active) => set({ isFirFlowActive: active }),
  setIsSafeTimerAlertActive: (active) => set({ isSafeTimerAlertActive: active }),
  setPendingNavigationTarget: (target) => set({ pendingNavigationTarget: target }),
  setFakeCallActive: (active) => set({ isFakeCallActive: active }),
  setVoiceTriggerActive: (active) => {
    localStorage.setItem('kavach_voice_trigger', String(active));
    set({ isVoiceTriggerActive: active });
  }
});
