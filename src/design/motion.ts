export const motion = {
  durations: {
    fast: 120,    // Micro-interactions / Feedback
    normal: 180,  // Standard UI hover/active states
    medium: 220,  // Small panel / sheet transitions
    slow: 320,    // Full page layout transitions
    hero: 700,    // Ambient animations (Orb, Index counter)
  },
  springs: {
    default: { stiffness: 300, damping: 25 },
    hero: { stiffness: 100, damping: 15 },
    emergency: { stiffness: 500, damping: 30 },
  },
  curves: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.87, 0, 0.13, 1)',
  }
};
