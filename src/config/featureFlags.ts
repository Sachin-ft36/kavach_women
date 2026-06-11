/**
 * Kavach Feature Flags Engine
 * Used for safe rollout of massive architectural refactors and new capabilities.
 */

export const FeatureFlags = {
  // New Slices Refactor (Sprint 3)
  ENABLE_NEW_STORE: false,
  
  // SOS Refactor (Sprint 3)
  ENABLE_NEW_SOS_CONTROLLER: false,
  
  // Protector Dashboard Refactor (Sprint 3)
  ENABLE_NEW_PROTECTOR_DASHBOARD: false,
  
  // Security & Reliability (Sprints 1 & 2)
  ENABLE_INTEGRITY: true,
  ENABLE_DLQ: true,
  ENABLE_SLA_ENGINE: true,
};
