import { IncidentStatus } from '../types/supercell';

export const calculateProtectorReliabilityScore = (protectorId: string) => {
  // Mock calculation based on theoretical metrics
  const mockResponseRate = Math.random() * (100 - 80) + 80; // 80-100%
  const mockAvgEta = Math.random() * 5 + 2; // 2-7 mins
  
  let score = mockResponseRate - (mockAvgEta * 2);
  if (score > 100) score = 100;
  
  let rank: 'Gold' | 'Silver' | 'Bronze' | 'Unranked' = 'Unranked';
  if (score >= 90) rank = 'Gold';
  else if (score >= 75) rank = 'Silver';
  else if (score >= 50) rank = 'Bronze';
  
  return { score: Math.round(score), rank };
};

export const computeIncidentSLA = (
  incident: any,
  newStatus: IncidentStatus,
  responderId?: string
) => {
  const now = Date.now();
  const creationTime = incident.evidenceChain.length > 0 
    ? incident.evidenceChain[incident.evidenceChain.length - 1].capturedAt 
    : now;

  if (newStatus === "ACKNOWLEDGED" && !incident.acknowledgedAt) {
    incident.acknowledgedAt = now;
    incident.timeToAcknowledgeMs = now - creationTime;
    if (responderId) incident.assignedProtectorId = responderId;
  } else if (newStatus === "ASSIGNED" && !incident.assignedAt) {
    incident.assignedAt = now;
    incident.timeToAssignMs = incident.acknowledgedAt ? now - incident.acknowledgedAt : now - creationTime;
  } else if (newStatus === "ARRIVED" && !incident.arrivedAt) {
    incident.arrivedAt = now;
    incident.timeToReachMs = incident.assignedAt ? now - incident.assignedAt : now - creationTime;
  } else if ((newStatus === "RESOLVED" || newStatus === "CLOSED") && !incident.resolvedAt) {
    incident.resolvedAt = now;
    incident.timeToResolveMs = now - creationTime;
  }
};
