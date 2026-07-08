import { useProtectionStore, ProtectionState, RiskState } from '../../state/protectionStore';
import { useUIStore } from '../../state/uiStore';
import { EventBus } from '../events/EventBus';
import { ALL_EVENTS } from '../events/eventConstants';
import { calculateProtectionIndex, SystemStatusInput, defaultWeights } from './ProtectionFormula';
import { Logger } from '../telemetry/Logger';

export class ProtectionEngine {
  private static instance: ProtectionEngine;
  private currentInput: SystemStatusInput = {
    hasGuardians: true,
    isJourneyActive: false,
    hasPermissions: true,
    isBatteryHealthy: true,
    isGpsAccurate: true,
    isEvidenceEncrypted: true,
    isCommunityConnected: true,
  };

  private constructor() {
    this.setupEventBusListeners();
  }

  public static getInstance(): ProtectionEngine {
    if (!ProtectionEngine.instance) {
      ProtectionEngine.instance = new ProtectionEngine();
    }
    return ProtectionEngine.instance;
  }

  /**
   * Listen to System & Domain events to trigger state changes
   */
  private setupEventBusListeners(): void {
    const bus = EventBus.getInstance();

    // Listen to battery level alerts
    bus.subscribe(ALL_EVENTS.BATTERY_LEVEL_CHANGED, (event) => {
      const { healthy } = event.payload;
      this.currentInput.isBatteryHealthy = healthy;
      this.evaluateState();
    });

    // Listen to network transitions
    bus.subscribe(ALL_EVENTS.NETWORK_STATUS_CHANGED, (event) => {
      const { online } = event.payload;
      this.evaluateState();
    });

    // Listen to SOS triggers
    bus.subscribe(ALL_EVENTS.SOS_TRIGGERED, () => {
      this.transitionProtectionState('EMERGENCY');
    });

    bus.subscribe(ALL_EVENTS.SOS_CANCELLED, () => {
      this.transitionProtectionState('RECOVERY');
    });
  }

  /**
   * Transition Protection state and notify UI Stores
   */
  public transitionProtectionState(state: ProtectionState): void {
    const store = useProtectionStore.getState();
    const uiStore = useUIStore.getState();

    Logger.info(`[ProtectionEngine] Transitioning Protection State to: ${state}`, {
      previous: store.protectionState,
      next: state,
    });

    store.setProtectionState(state);

    // Dynamic emergency overlay changes when SOS is triggered/cancelled
    if (state === 'EMERGENCY') {
      uiStore.setEmergencyOverlay(true);
    } else if (state === 'RECOVERY' || state === 'READY') {
      uiStore.setEmergencyOverlay(false);
    }
  }

  /**
   * Re-evaluate Risk State and calculate Protection Index
   */
  public evaluateState(): void {
    const store = useProtectionStore.getState();
    const index = calculateProtectionIndex(this.currentInput, defaultWeights);

    let risk: RiskState = 'EXCELLENT';
    if (index < 50) {
      risk = 'CRITICAL';
    } else if (index < 75) {
      risk = 'REDUCED';
    } else if (index < 90) {
      risk = 'GOOD';
    }

    store.setProtectionIndex(index);
    store.setRiskState(risk);

    Logger.info('[ProtectionEngine] Evaluated Risk State', {
      index,
      risk,
    });

    // Broadcast index update event
    EventBus.getInstance().publish({
      id: Math.random().toString(36).substr(2, 9),
      type: ALL_EVENTS.PROTECTION_SCORE_UPDATED,
      timestamp: Date.now(),
      payload: { index, risk },
      meta: { deviceId: 'LOCAL_DEV', version: '1.1.0' },
    });
  }
}
