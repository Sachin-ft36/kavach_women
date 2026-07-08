import { GeoPoint, EvidenceRecord, TelemetryData } from '../../types';

export type IncidentStatus = 
  | 'CREATED' 
  | 'ACKNOWLEDGED' 
  | 'ASSIGNED' 
  | 'EN_ROUTE' 
  | 'ARRIVED' 
  | 'RESOLVED' 
  | 'CLOSED' 
  | 'ABORTED';

/**
 * Domain Entity representing a Kavach Emergency Incident.
 * Encapsulates the core business logic, strict state transitions,
 * and SLAs for an incident.
 */
export class IncidentEntity {
  id: string;
  victimId: string;
  status: IncidentStatus;
  location: GeoPoint;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  evidenceChain: EvidenceRecord[];
  sha256Seal?: string;
  
  // SLA Timestamps
  createdAt: number;
  acknowledgedAt?: number;
  assignedAt?: number;
  arrivedAt?: number;
  resolvedAt?: number;
  
  telemetryLog: TelemetryData[];

  constructor(
    id: string, 
    victimId: string, 
    location: GeoPoint, 
    status: IncidentStatus = 'CREATED',
    createdAt: number = Date.now()
  ) {
    this.id = id;
    this.victimId = victimId;
    this.location = location;
    this.status = status;
    this.createdAt = createdAt;
    this.priority = 'CRITICAL';
    this.evidenceChain = [];
    this.telemetryLog = [];
  }

  /**
   * Domain rules for state transitions.
   */
  canTransitionTo(newStatus: IncidentStatus): boolean {
    const transitions: Record<IncidentStatus, IncidentStatus[]> = {
      'CREATED': ['ACKNOWLEDGED', 'ABORTED', 'RESOLVED'],
      'ACKNOWLEDGED': ['ASSIGNED', 'ABORTED', 'RESOLVED'],
      'ASSIGNED': ['EN_ROUTE', 'ARRIVED', 'ABORTED', 'RESOLVED'],
      'EN_ROUTE': ['ARRIVED', 'ABORTED', 'RESOLVED'],
      'ARRIVED': ['RESOLVED', 'ABORTED'],
      'RESOLVED': ['CLOSED'],
      'ABORTED': ['CLOSED'],
      'CLOSED': []
    };

    return transitions[this.status].includes(newStatus);
  }

  transition(newStatus: IncidentStatus) {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Domain Rule Violation: Cannot transition from ${this.status} to ${newStatus}`);
    }
    this.status = newStatus;
    
    // Auto-fill SLA timestamps based on transition
    const now = Date.now();
    switch (newStatus) {
      case 'ACKNOWLEDGED': this.acknowledgedAt = now; break;
      case 'ASSIGNED': this.assignedAt = now; break;
      case 'ARRIVED': this.arrivedAt = now; break;
      case 'RESOLVED': this.resolvedAt = now; break;
    }
  }

  addEvidence(node: EvidenceRecord) {
    // Basic domain validation
    if (this.status === 'CLOSED') {
      throw new Error('Cannot add evidence to a closed incident.');
    }
    this.evidenceChain.unshift(node);
  }

  addTelemetry(data: TelemetryData) {
    if (this.status === 'CLOSED') return;
    this.telemetryLog.push(data);
  }

  /**
   * Calculates time-to-reach SLA in milliseconds
   */
  calculateTimeToReach(): number | null {
    if (!this.arrivedAt || !this.assignedAt) return null;
    return this.arrivedAt - this.assignedAt;
  }
}
