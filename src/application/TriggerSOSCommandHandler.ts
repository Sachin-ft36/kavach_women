import { Command, ICommandHandler } from './CQRS';
import { Result } from '../shared/Result';
import { ProtectionEngine } from '../engine/engine/ProtectionEngine';
import { EventBus } from '../engine/events/EventBus';
import { ALL_EVENTS } from '../engine/events/eventConstants';
import { Logger } from '../engine/telemetry/Logger';

export class TriggerSOSCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: number;

  constructor(commandId: string, timestamp: number) {
    this.commandId = commandId;
    this.timestamp = timestamp;
  }
}

export class TriggerSOSCommandHandler implements ICommandHandler<TriggerSOSCommand, void> {
  public async execute(command: TriggerSOSCommand): Promise<Result<void>> {
    try {
      Logger.info(`[CQRS] Executing TriggerSOSCommand: ${command.commandId}`);

      // Transition engine state to EMERGENCY
      const engine = ProtectionEngine.getInstance();
      engine.transitionProtectionState('EMERGENCY');

      // Publish Domain Event
      await EventBus.getInstance().publish({
        id: Math.random().toString(36).substr(2, 9),
        type: ALL_EVENTS.SOS_TRIGGERED,
        timestamp: Date.now(),
        payload: { source: 'button' },
        meta: { deviceId: 'LOCAL_DEV', version: '1.1.0' },
      });

      return Result.success(undefined);
    } catch (err) {
      Logger.error('[CQRS] Failed to execute TriggerSOSCommand', err);
      return Result.failure(err as any);
    }
  }
}
