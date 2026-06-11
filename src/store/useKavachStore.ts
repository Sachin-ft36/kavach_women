import { create } from 'zustand';
import { KavachState } from './slices/types';
import { createAuthSlice } from './slices/authSlice';
import { createSOSSlice } from './slices/sosSlice';
import { createLocationSlice } from './slices/locationSlice';
import { createRideSlice } from './slices/rideSlice';
import { createUISlice } from './slices/uiSlice';
import { createHardwareSlice } from './slices/hardwareSlice';
import { createProtectorSlice } from './slices/protectorSlice';
import { createTelemetrySlice } from './slices/telemetrySlice';
import { createSettingsSlice } from './slices/settingsSlice';

export const useKavachStore = create<KavachState>((...a) => ({
  ...createAuthSlice(...a),
  ...createLocationSlice(...a),
  ...createHardwareSlice(...a),
  ...createSOSSlice(...a),
  ...createRideSlice(...a),
  ...createUISlice(...a),
  ...createProtectorSlice(...a),
  ...createTelemetrySlice(...a),
  ...createSettingsSlice(...a),
}));

export type { KavachState };
