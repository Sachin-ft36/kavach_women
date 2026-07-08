export interface ProtectionFormulaWeights {
  guardians: number;
  journey: number;
  permissions: number;
  battery: number;
  gps: number;
  evidence: number;
  community: number;
}

export const defaultWeights: ProtectionFormulaWeights = {
  guardians: 25,
  journey: 20,
  permissions: 15,
  battery: 10,
  gps: 10,
  evidence: 10,
  community: 10,
};

export interface SystemStatusInput {
  hasGuardians: boolean;
  isJourneyActive: boolean;
  hasPermissions: boolean;
  isBatteryHealthy: boolean; // battery > 15%
  isGpsAccurate: boolean;
  isEvidenceEncrypted: boolean;
  isCommunityConnected: boolean;
}

/**
 * Calculate Protection Index (0 - 100) based on system parameters and weights
 */
export function calculateProtectionIndex(
  input: SystemStatusInput,
  weights: ProtectionFormulaWeights = defaultWeights
): number {
  let score = 0;

  if (input.hasGuardians) score += weights.guardians;
  if (input.isJourneyActive) score += weights.journey;
  if (input.hasPermissions) score += weights.permissions;
  if (input.isBatteryHealthy) score += weights.battery;
  if (input.isGpsAccurate) score += weights.gps;
  if (input.isEvidenceEncrypted) score += weights.evidence;
  if (input.isCommunityConnected) score += weights.community;

  return score;
}
