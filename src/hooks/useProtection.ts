import { useProtectionStore, ProtectionState, RiskState } from '../state/protectionStore';
import { CqrsMediator } from '../application/CQRS';

export function useProtection() {
  const protectionState = useProtectionStore((state) => state.protectionState);
  const riskState = useProtectionStore((state) => state.riskState);
  const protectionIndex = useProtectionStore((state) => state.protectionIndex);

  const startMonitoring = async () => {
    return CqrsMediator.getInstance().send('StartMonitoringCommand', {
      commandId: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    });
  };

  const triggerSOS = async () => {
    return CqrsMediator.getInstance().send('TriggerSOSCommand', {
      commandId: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    });
  };

  const cancelSOS = async () => {
    return CqrsMediator.getInstance().send('CancelSOSCommand', {
      commandId: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    });
  };

  return {
    protectionState,
    riskState,
    protectionIndex,
    startMonitoring,
    triggerSOS,
    cancelSOS,
  };
}
