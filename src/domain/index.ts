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

export interface ResponderEntity {
  id: string;
  status: 'dispatched' | 'arrived' | 'cancelled';
  timestamp: Date | any; // Firestore Timestamp
}

export * from './Incident';
export * from './Protector';
export * from './Audit';
