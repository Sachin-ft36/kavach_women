import { IEvidenceRepository, EvidenceModel } from '../domains/evidence/repository/IEvidenceRepository';
import { Result, AppError } from '../shared/Result';
import { db } from '../firebase';
import { doc, getDocs, setDoc, query, collection, where } from 'firebase/firestore';

export class FirestoreEvidenceRepository implements IEvidenceRepository {
  public async save(evidence: EvidenceModel): Promise<Result<void>> {
    try {
      const docRef = doc(db, 'evidence_packages', evidence.id);
      await setDoc(docRef, evidence);
      return Result.success(undefined);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', 'Failed to save evidence package to Firestore', err));
    }
  }

  public async listByIncident(incidentId: string): Promise<Result<EvidenceModel[]>> {
    try {
      const collRef = collection(db, 'evidence_packages');
      const q = query(collRef, where('incidentId', '==', incidentId));
      const snapshots = await getDocs(q);
      const list: EvidenceModel[] = [];
      snapshots.forEach((doc) => {
        list.push(doc.data() as EvidenceModel);
      });
      return Result.success(list);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', 'Failed to query evidence packages for incident', err));
    }
  }

  /**
   * Cryptographically verify if raw data bytes match the recorded file hash
   */
  public async verifyIntegrity(id: string, fileBytes: ArrayBuffer): Promise<Result<boolean>> {
    try {
      const docRef = doc(db, 'evidence_packages', id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return Result.failure(new AppError('NOT_FOUND', `Evidence package with ID ${id} not found`));
      }
      const model = snapshot.data() as EvidenceModel;

      // SHA-256 calculation
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      return Result.success(calculatedHash === model.fileHash);
    } catch (err) {
      return Result.failure(new AppError('SECURITY_ERROR', 'Failed to compute SHA-256 hash or verify integrity', err));
    }
  }
}

// Inline import resolver for mock module structure compat
import { getDoc } from 'firebase/firestore';
