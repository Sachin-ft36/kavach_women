export type IncidentStatus =
  | "CREATED"
  | "ACKNOWLEDGED"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "RESOLVED"
  | "CLOSED";

export interface EvidenceNode {
  evidenceId: string;
  capturedAt: number;
  capturedBy: string;
  hash: string;
  deviceId: string;
  previousHash: string;
  digitalSignature?: string;
}

export interface TelemetrySnapshot {
  lat: number;
  lng: number;
  speed: number;
  decibel: number;
  timestamp: number;
}

export interface IncidentCluster {
  incidentId: string;
  victimName: string;
  status: IncidentStatus;
  assignedProtectorId?: string;
  assignedPCRId?: string;
  acknowledgedAt?: number;
  assignedAt?: number;
  arrivedAt?: number;
  resolvedAt?: number;
  closedAt?: number;
  incidentVersion: number;
  currentLatLng: [number, number]; // SWAP WARNING: Convert [Lat, Lng] to strict Mapbox GL [Lng, Lat] format
  forensicTranscript: string;
  nearestThanaName: string;
  bnsOffenseCategory: string;
  decibelLevel: number; // Real-time volume RMS telemetry
  sha256Seal: string; // [🔒 CRYPTO-SEALED via BNSS Sec 63]
  systemLogs: string[]; // Hacker-style rolling terminal console records
  
  // Phase 11: SLAs
  timeToAcknowledgeMs?: number;
  timeToAssignMs?: number;
  timeToReachMs?: number;
  timeToResolveMs?: number;
  
  // Phase 13: Evidence Vault (Chain of Custody)
  evidenceChain: EvidenceNode[];
  incidentTampered?: boolean;
  tamperLevel?: string;
}
