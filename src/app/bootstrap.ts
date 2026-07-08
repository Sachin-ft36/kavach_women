import { CqrsMediator } from '../application/CQRS';
import { StartMonitoringCommandHandler } from '../application/StartMonitoringCommandHandler';
import { TriggerSOSCommandHandler } from '../application/TriggerSOSCommandHandler';
import { CancelSOSCommandHandler } from '../application/CancelSOSCommandHandler';
import { ProtectionEngine } from '../engine/engine/ProtectionEngine';
import { PermissionEngine } from '../engine/capability/PermissionEngine';
import { Logger } from '../engine/telemetry/Logger';
import { Capacitor } from '@capacitor/core';

export function bootstrapKavach(): void {
  Logger.info('[App] Bootstrapping KAVACH Platform...');

  // 1. Resolve Platform Target
  const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  PermissionEngine.setPlatform(platform);
  Logger.info(`[App] Resolved Platform Target: ${platform}`);

  // 2. Register CQRS Handlers on Mediator
  const mediator = CqrsMediator.getInstance();
  mediator.registerCommandHandler('StartMonitoringCommand', new StartMonitoringCommandHandler());
  mediator.registerCommandHandler('TriggerSOSCommand', new TriggerSOSCommandHandler());
  mediator.registerCommandHandler('CancelSOSCommand', new CancelSOSCommandHandler());

  Logger.info('[App] CQRS Handlers registered successfully.');

  // 3. Initialize Protection Engine Singleton
  ProtectionEngine.getInstance();
  Logger.info('[App] Protection Engine Singleton initialized.');

  Logger.info('[App] KAVACH Platform Bootstrapped successfully. System Armed.');
}
