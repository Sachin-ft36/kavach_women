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

export interface SystemLog {
  id?: string;
  type: string;
  message: string;
  timestamp: any;
  level?: 'info' | 'warn' | 'error' | 'critical';
  metadata?: any;
}
