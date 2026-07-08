// Strongly-typed system events
export type AIEventPayloadMap = {
  "voice.start": void;
  "voice.stop": void;
  "sos.trigger": { mode: "voice" | "button" | "automatic" };
  "sos.resolve": void;
  "battery.low": { level: number };
  "network.offline": void;
  "network.online": void;
  "location.lost": void;
  "state.change": { from: string; to: string };
};

export type AIEventName = keyof AIEventPayloadMap;
export type AIEventListener<T extends AIEventName> = (payload: AIEventPayloadMap[T]) => void;

class EventBus {
  private listeners: { [key in AIEventName]?: AIEventListener<any>[] } = {};

  public on<T extends AIEventName>(event: T, listener: AIEventListener<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);

    return () => this.off(event, listener);
  }

  public off<T extends AIEventName>(event: T, listener: AIEventListener<T>): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = list.filter((l) => l !== listener);
  }

  public emit<T extends AIEventName>(event: T, payload: AIEventPayloadMap[T]): void {
    const list = this.listeners[event];
    if (!list) return;
    list.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error(`Error executing listener for event ${event}:`, err);
      }
    });
  }
}

// Global Singleton Event Bus for KAVACH AI SDK
export const aiEventBus = new EventBus();
