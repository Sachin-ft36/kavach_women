import { Command, ICommandHandler } from './CQRS';
import { Result } from '../shared/Result';
import { ProtectionEngine } from '../engine/engine/ProtectionEngine';
import { EventBus } from '../engine/events/EventBus';
import { ALL_EVENTS } from '../engine/events/eventConstants';
import { Logger } from '../engine/telemetry/Logger';

export class StartMonitoringCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: number;

  constructor(commandId: string, timestamp: number) {
    this.commandId = commandId;
    this.timestamp = timestamp;
  }
}

export class StartMonitoringCommandHandler implements ICommandHandler<StartMonitoringCommand, void> {
  public async execute(command: StartMonitoringCommand): Promise<Result<void>> {
    try {
      Logger.info(`[CQRS] Executing StartMonitoringCommand: ${command.commandId}`);

      // Transition engine state to MONITORING
      const engine = ProtectionEngine.getInstance();
      engine.transitionProtectionState('MONITORING');
      engine.evaluateState();

      // Publish Domain Event
      await EventBus.getInstance().publish({
        id: Math.random().toString(36).substr(2, 9),
        type: ALL_EVENTS.PROTECTION_STARTED,
        timestamp: Date.now(),
        payload: { active: true },
        meta: { deviceId: 'LOCAL_DEV', version: '1.1.0' },
      });

      return Result.success(undefined);
    } catch (err) {
      Logger.error('[CQRS] Failed to execute StartMonitoringCommand', err);
      return Result.failure(err as any);
    }
  }
}
