import { LocationData } from './index';

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
  isRegistered?: boolean;
  xp?: number;
  rating?: number;
  ratingCount?: number;
  level?: string;
  livesHelped?: number;
  successRate?: number;
  avgResponse?: string;
  photoUrl?: string;
  photoURL?: string;
  badgeId?: string;
  thanaName?: string;
  protectorVetting?: {
    occupation?: string;
  };
}
