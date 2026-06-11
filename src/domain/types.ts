import { GeoPoint } from 'firebase/firestore';

// ==========================================
// 🚨 INCIDENT & ALERT DOMAIN
// ==========================================

export interface LocationData {
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  address?: string;
  name?: string;
}

export interface SystemLog {
  id?: string;
  type: string;
  message: string;
  timestamp: any;
  level?: 'info' | 'warn' | 'error' | 'critical';
  metadata?: any;
}

export interface ResponderEntity {
  id: string;
  status: 'dispatched' | 'arrived' | 'cancelled';
  timestamp: Date | any; // Firestore Timestamp
}

export interface IncidentRecord {
  id: string;
  userId?: string;
  victimUid?: string;
  victimName?: string;
  userName?: string;
  name?: string;
  gender?: string;
  phone?: string;
  phoneNumber?: string;
  victimPhone?: string;
  
  // Location Fallbacks
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  location?: LocationData;
  city?: string;
  district?: string;
  locationCity?: string;
  victimCity?: string;
  address?: string;
  locationName?: string;
  incidentAddress?: string;
  fullAddress?: string;
  state?: string;
  locationState?: string;
  victimState?: string;
  nearestPoliceStation?: string;
  policeStation?: string;
  nearbyTolls?: any[];

  // Core Status
  status: 'active' | 'Active' | 'ACTIVE' | 'responding' | 'Responding' | 'resolved' | 'closed' | 'CLOSED';
  priority?: number;
  timestamp?: any;
  dispatchedAt?: any;
  createdAt?: string;
  lastUpdated?: any;
  
  // Dispatch Status
  responderUid?: string | null;
  responderName?: string | null;
  activeResponders?: ResponderEntity[];
  inactivityEscalated?: boolean;
  inactivityReassigned?: boolean;

  // Tactical Payload
  audioUrl?: string;
  stealthAudio?: boolean;
  audioTranscript?: string;
  escapeVectorActive?: boolean;
  nakabandiDeployed?: boolean;
  remoteSirenTriggered?: boolean;
  tollInterdictTime?: any;
}

// ==========================================
// 🛡️ PROTECTOR & USER DOMAIN
// ==========================================

export interface UserProfile {
  id: string;
  uid?: string;
  userId?: string;
  name?: string;
  displayName?: string;
  role?: string;
  gender?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  aadhaar?: string;
  aadhar?: string;
  state?: string;
  city?: string;
  address?: string;
  fullAddress?: string;

  // Verification & Sentinel Status
  isVerified?: boolean;
  verified?: boolean;
  verificationDate?: any;
  originCollection?: string;
  active?: boolean;
  isOnDuty?: boolean;

  // Location
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  lastLocation?: LocationData;
  location?: LocationData;

  // PCR Specific
  vehicleNo?: string;
  rank?: string;
  currentDispatchStatus?: string;
  currentAlertId?: string;
  respondingToAlertId?: string;

  // Additional Meta
  protectorVetting?: {
    occupation?: string;
  };
}

// ==========================================
// ⚖️ JUSTICE & AUDIT DOMAIN
// ==========================================

export interface ZeroFIRRecord {
  id: string;
  caseId?: string;
  victimUid?: string;
  userId?: string;
  uid?: string;
  victimName?: string;
  phone?: string;
  city?: string;
  state?: string;
  area?: string;
  dest?: string;
  status?: string;
  timestamp?: any;
  createdAt?: string;
  incidentLocation?: {
    city?: string;
    display?: string;
  };
}

export interface JourneyRecord {
  id: string;
  userId?: string;
  status: 'active' | 'emergency' | 'completed';
}
