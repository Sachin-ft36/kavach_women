import statesTokens from "../styles/tokens/states.json";

export interface StateConfig {
  color: string;
  motion: string;
  face: string;
  haptic: string | null;
  audio: string | null;
}

export class StateRegistry {
  private statesMap: Map<string, StateConfig> = new Map();

  constructor() {
    // Load from states token config
    Object.entries(statesTokens.states).forEach(([stateName, config]) => {
      this.statesMap.set(stateName, config as StateConfig);
    });
  }

  public resolve(state: string): StateConfig {
    const config = this.statesMap.get(state);
    if (!config) {
      // Fallback to idle config
      return this.statesMap.get("idle")!;
    }
    return config;
  }
}

export const stateRegistry = new StateRegistry();
