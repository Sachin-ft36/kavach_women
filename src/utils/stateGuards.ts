export const VALID_TRANSITIONS: Record<string, string[]> = {
  'CREATED': ['ACKNOWLEDGED', 'ASSIGNED', 'ABORTED'],
  'ACKNOWLEDGED': ['ASSIGNED', 'ABORTED'],
  'ASSIGNED': ['ARRIVED', 'ABORTED', 'REASSIGNED'],
  'REASSIGNED': ['ARRIVED', 'ABORTED', 'REASSIGNED'],
  'ARRIVED': ['RESOLVED', 'CLOSED'],
  'RESOLVED': ['CLOSED'],
  'CLOSED': [],
  'ABORTED': []
};

// Also define standard app states for use in sosService which might use lower-case
export const APP_VALID_TRANSITIONS: Record<string, string[]> = {
  'active': ['responding', 'aborted', 'cancelled', 'rescued_pending_victim_clearance'],
  'responding': ['arrived', 'aborted', 'rescued_pending_victim_clearance'],
  'arrived': ['rescued_pending_victim_clearance', 'resolved'],
  'rescued_pending_victim_clearance': ['resolved'],
  'resolved': ['closed'],
  'aborted': [],
  'cancelled': [],
  'closed': []
};

export class StateTransitionError extends Error {
  constructor(current: string, next: string) {
    super(`[KAVACH GUARD] Invalid State Transition: Cannot move from ${current} to ${next}.`);
    this.name = 'StateTransitionError';
  }
}

export const validateTransition = (current: string, next: string, context: 'COMMAND' | 'APP' = 'COMMAND'): boolean => {
  if (current.toLowerCase() === next.toLowerCase()) return true;
  
  const map = context === 'COMMAND' ? VALID_TRANSITIONS : APP_VALID_TRANSITIONS;
  const allowed = map[current] || map[current.toUpperCase()] || map[current.toLowerCase()];
  
  if (!allowed) {
    console.warn(`[KAVACH GUARD] Unknown origin state: ${current}`);
    return false;
  }
  
  return allowed.map(s => s.toLowerCase()).includes(next.toLowerCase());
};
