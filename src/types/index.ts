export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ProtectorRecord {
  uid: string;
  name: string;
  phone: string;
  role: 'protector';
  isVerified: boolean;
  xp: number;
  livesSaved: number;
  successfulRescues: number;
  abortedAssists: number;
  missionHistory: MissionActivity[];
  rating: number;
  ratingCount: number;
  lastLocation?: GeoPoint;
  lastActive?: number;
}

export interface MissionActivity {
  id: string;
  victimName: string;
  timestamp: number;
  meritEarned: number;
  outcome: 'VERIFIED_RESCUE' | 'ABORTED_DURING_ASSIST' | 'ESCALATED' | 'COMPLETED';
}

export interface EvidenceRecord {
  evidenceId: string;
  capturedAt: number;
  capturedBy: string;
  hash: string;
  deviceId: string;
  previousHash: string;
  digitalSignature: string;
  publicKey: string;
}

export interface TelemetryData {
  battery?: number;
  signal?: string;
  [key: string]: unknown;
}

export interface AlertRecord {
  id: string;
  victimUid: string;
  status: 'active' | 'responding' | 'rescued_pending_victim_clearance' | 'resolved' | 'aborted' | 'cancelled' | 'closed';
  triggerMethod: 'button' | 'shake' | 'voice' | 'silent' | 'ride' | 'power' | 'remote';
  latitude: number;
  longitude: number;
  timestamp: number;
  lastUpdated?: number;
  handshakeCode?: string;
  priority?: string;
  isFakeCallActive?: boolean;
  telemetry?: TelemetryData;
  evidenceChain?: EvidenceRecord[];
}

export interface IncidentRecord {
  incidentId: string;
  victimId: string;
  status: 'CREATED' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'ARRIVED' | 'RESOLVED' | 'CLOSED' | 'ABORTED';
  location: GeoPoint;
  address?: string;
  type: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  evidenceChain: EvidenceRecord[];
  sha256Seal?: string;
  acknowledgedAt?: number;
  assignedAt?: number;
  arrivedAt?: number;
  resolvedAt?: number;
  timeToAcknowledgeMs?: number;
  timeToAssignMs?: number;
  timeToReachMs?: number;
  timeToResolveMs?: number;
  assignedProtectorId?: string;
}

export interface PCRRecord {
  pcrId: string;
  officerName: string;
  vehicleNo: string;
  thanaName: string;
  location: GeoPoint;
  status: 'IDLE' | 'RESPONDING' | 'OFF_DUTY';
  respondingToAlertId?: string;
}

export interface UserProfile {
  uid: string;
  name?: string;
  email?: string;
  role: 'citizen' | 'protector' | 'pcr_officer' | 'admin' | 'super_cell';
  gender?: 'female' | 'male' | string;
  isVerified?: boolean;
  isRegistered?: boolean;
  isSOSBlocked?: boolean;
  isPermanentlyBlocked?: boolean;
  sosBlockedReason?: string;
  sosStrikeCount?: number;
  hasPendingWarning?: boolean;
  warningMessage?: string;
  xp?: number;
  lastLocation?: GeoPoint;
  
  // Extra fields
  photoUrl?: string;
  photoURL?: string;
  displayPhotoUrl?: string;
  displayName?: string;
  phoneNumber?: string;
  phone?: string;
  aadhaarMasked?: string;
  protectorStatus?: string;
  isOnDuty?: boolean;
  vehicleNo?: string;
  thanaName?: string;
  rank?: string;
  badgeId?: string;
  address?: string;
  respondingToAlertId?: string;
  status?: string;
  state?: string;
  rating?: number;
  ratingCount?: number;
  level?: string;
  livesHelped?: number;
  successRate?: number;
  avgResponse?: string;
  recentActivity?: MissionActivity[];
  activities?: MissionActivity[];
  missionHistory?: MissionActivity[];
  trustTier?: string;
  completedMissions?: number;
}
