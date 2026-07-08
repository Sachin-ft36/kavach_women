import { Result } from '../shared/Result';

export interface Command {
  readonly commandId: string;
  readonly timestamp: number;
}

export interface Query<T = any> {
  readonly queryId: string;
  readonly timestamp: number;
}

export interface ICommandHandler<C extends Command, R = void> {
  execute(command: C): Promise<Result<R>>;
}

export interface IQueryHandler<Q extends Query<R>, R> {
  execute(query: Q): Promise<Result<R>>;
}

export class CqrsMediator {
  private static instance: CqrsMediator;
  private commandHandlers: Map<string, ICommandHandler<any, any>> = new Map();
  private queryHandlers: Map<string, IQueryHandler<any, any>> = new Map();

  private constructor() {}

  public static getInstance(): CqrsMediator {
    if (!CqrsMediator.instance) {
      CqrsMediator.instance = new CqrsMediator();
    }
    return CqrsMediator.instance;
  }

  /**
   * Register a command handler
   */
  public registerCommandHandler<C extends Command, R>(
    commandName: string,
    handler: ICommandHandler<C, R>
  ): void {
    this.commandHandlers.set(commandName, handler);
  }

  /**
   * Register a query handler
   */
  public registerQueryHandler<Q extends Query<R>, R>(
    queryName: string,
    handler: IQueryHandler<Q, R>
  ): void {
    this.queryHandlers.set(queryName, handler);
  }

  /**
   * Dispatch a command to its registered handler
   */
  public async send<C extends Command, R>(commandName: string, command: C): Promise<Result<R>> {
    const handler = this.commandHandlers.get(commandName);
    if (!handler) {
      throw new Error(`[CQRS] No command handler registered for command: ${commandName}`);
    }
    return handler.execute(command);
  }

  /**
   * Dispatch a query to its registered handler
   */
  public async query<Q extends Query<R>, R>(queryName: string, query: Q): Promise<Result<R>> {
    const handler = this.queryHandlers.get(queryName);
    if (!handler) {
      throw new Error(`[CQRS] No query handler registered for query: ${queryName}`);
    }
    return handler.execute(query);
  }

  /**
   * Clear all registrations (useful for tests)
   */
  public clear(): void {
    this.commandHandlers.clear();
    this.queryHandlers.clear();
  }
}
