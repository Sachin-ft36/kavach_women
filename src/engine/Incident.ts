import { LocationData, ResponderEntity } from './index';

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
  status: 'active' | 'Active' | 'ACTIVE' | 'responding' | 'Responding' | 'resolved' | 'closed' | 'CLOSED' | 'aborted' | 'ABORTED';
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

export interface JourneyRecord {
  id: string;
  userId?: string;
  status: 'active' | 'emergency' | 'completed';
}
