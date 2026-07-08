import { IGuardianRepository, GuardianModel } from '../domains/guardian/repository/IGuardianRepository';
import { Result, AppError } from '../shared/Result';
import { db } from '../firebase';
import { doc, getDocs, setDoc, deleteDoc, updateDoc, collection } from 'firebase/firestore';

export class FirestoreGuardianRepository implements IGuardianRepository {
  public async add(userId: string, guardian: Omit<GuardianModel, 'isOnline' | 'lastActive'>): Promise<Result<void>> {
    try {
      const docRef = doc(db, 'users', userId, 'guardians', guardian.id);
      await setDoc(docRef, {
        ...guardian,
        isOnline: false,
        lastActive: Date.now(),
      });
      return Result.success(undefined);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', 'Failed to link guardian in Firestore', err));
    }
  }

  public async remove(userId: string, guardianId: string): Promise<Result<void>> {
    try {
      const docRef = doc(db, 'users', userId, 'guardians', guardianId);
      await deleteDoc(docRef);
      return Result.success(undefined);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', 'Failed to unlink guardian in Firestore', err));
    }
  }

  public async list(userId: string): Promise<Result<GuardianModel[]>> {
    try {
      const collRef = collection(db, 'users', userId, 'guardians');
      const snapshots = await getDocs(collRef);
      const list: GuardianModel[] = [];
      snapshots.forEach((doc) => {
        list.push(doc.data() as GuardianModel);
      });
      return Result.success(list);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', 'Failed to query guardians list from Firestore', err));
    }
  }

  public async updateStatus(guardianId: string, isOnline: boolean): Promise<Result<void>> {
    try {
      // Updates global status for cross-tenant visibility
      const docRef = doc(db, 'guardians_status', guardianId);
      await setDoc(docRef, {
        isOnline,
        lastActive: Date.now(),
      }, { merge: true });
      return Result.success(undefined);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', 'Failed to update guardian status', err));
    }
  }
}
