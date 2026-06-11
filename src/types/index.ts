export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ProtectorProfile {
  uid: string;
  name: string;
  phone: string;
  role: 'protector';
  isVerified: boolean;
  xp: number;
  livesSaved: number;
  successfulRescues: number;
  abortedAssists: number;
  missionHistory: any[];
  rating: number;
  ratingCount: number;
  lastLocation?: GeoPoint;
  lastActive?: any;
}

export interface Alert {
  id: string;
  victimUid: string;
  status: 'active' | 'resolved' | 'aborted';
  triggerMethod: 'button' | 'shake' | 'voice' | 'silent' | 'ride' | 'power' | 'remote';
  latitude: number;
  longitude: number;
  timestamp: any; // Firestore Timestamp
  lastUpdated?: any; // Firestore Timestamp
  handshakeCode?: string;
  priority?: string;
  isFakeCallActive?: boolean;
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
  
  // Extra fields for various roles
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
  stats?: any;
  rating?: number;
  ratingCount?: number;
  level?: string;
  livesHelped?: number;
  successRate?: number;
  avgResponse?: string;
  recentActivity?: any;
  activities?: any;
  protectorVetting?: any;
  missionHistory?: any;
}
