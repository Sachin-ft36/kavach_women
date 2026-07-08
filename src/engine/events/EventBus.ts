import { KavachEvent, KavachEventType } from './eventConstants';

type EventCallback<T = any> = (event: KavachEvent<T>) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private subscribers: Map<KavachEventType, Set<EventCallback>> = new Map();
  private globalSubscribers: Set<EventCallback> = new Set();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Register a subscriber for a specific event type
   */
  public subscribe<T = any>(type: KavachEventType, callback: EventCallback<T>): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);

    // Return an unsubscribe function
    return () => {
      const subs = this.subscribers.get(type);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(type);
        }
      }
    };
  }

  /**
   * Register a global subscriber for all event types
   */
  public subscribeAll(callback: EventCallback): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  /**
   * Publish an event and route it through the execution pipeline
   * Sequence: Validation -> Authorization -> Processing -> Persistence -> Broadcast
   */
  public async publish<T = any>(event: KavachEvent<T>): Promise<void> {
    try {
      // 1. Validation
      if (!event.id || !event.type || !event.timestamp) {
        throw new Error(`[EventBus] Invalid Event Payload: ${JSON.stringify(event)}`);
      }

      // 2. Authorization (stub hook for security audits)
      this.authorizeEvent(event);

      // 3. Processing (stub hook for state mutation pipelines)
      this.processEvent(event);

      // 4. Persistence (write domain events to local database/audit log first)
      await this.persistEvent(event);

      // 5. Broadcast (Notify UI Store subscribers)
      this.broadcast(event);

    } catch (error) {
      // Route pipeline failure directly to telemetry logger
      console.error(`[EventBus] Pipeline failure for event ${event.type}:`, error);
    }
  }

  private authorizeEvent(event: KavachEvent): void {
    // Platform rule checks go here (e.g. check user tokens before dispatching SOS alerts)
  }

  private processEvent(event: KavachEvent): void {
    // Intercepts to mutate or append telemetry properties
  }

  private async persistEvent(event: KavachEvent): Promise<void> {
    // Only persist Domain/Security events to audit stores
    if (event.type.startsWith('DOMAIN:')) {
      // Simulated local persistence layer
      // (Future: write to repositories/AuditRepository first)
    }
  }

  private broadcast(event: KavachEvent): void {
    // Notify type-specific subscribers
    const typeSubs = this.subscribers.get(event.type);
    if (typeSubs) {
      typeSubs.forEach((sub) => {
        try {
          sub(event);
        } catch (err) {
          console.error(`[EventBus] Subscriber error on ${event.type}:`, err);
        }
      });
    }

    // Notify global subscribers
    this.globalSubscribers.forEach((sub) => {
      try {
        sub(event);
      } catch (err) {
        console.error(`[EventBus] Global subscriber error on ${event.type}:`, err);
      }
    });
  }

  /**
   * Clear all subscribers (useful for test environments)
   */
  public clear(): void {
    this.subscribers.clear();
    this.globalSubscribers.clear();
  }
}
