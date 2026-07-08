import { Result } from '../../../shared/Result';

export interface EvidenceModel {
  id: string;
  incidentId: string;
  fileUrl: string;
  fileHash: string; // SHA-256 integrity hash
  timestamp: number;
  deviceSignature: string;
  sizeBytes: number;
}

export interface IEvidenceRepository {
  save(evidence: EvidenceModel): Promise<Result<void>>;
  listByIncident(incidentId: string): Promise<Result<EvidenceModel[]>>;
  verifyIntegrity(id: string, fileBytes: ArrayBuffer): Promise<Result<boolean>>;
}
