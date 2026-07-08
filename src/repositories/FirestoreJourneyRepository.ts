import { IJourneyRepository, JourneyModel, JourneyRoutePoint } from '../domains/journey/repository/IJourneyRepository';
import { Result, AppError } from '../shared/Result';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, query, collection, where, getDocs, limit } from 'firebase/firestore';

export class FirestoreJourneyRepository implements IJourneyRepository {
  public async save(journey: JourneyModel): Promise<Result<void>> {
    try {
      const docRef = doc(db, 'journeys', journey.id);
      await setDoc(docRef, journey);
      return Result.success(undefined);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', 'Failed to save journey to Firestore', err));
    }
  }

  public async findById(id: string): Promise<Result<JourneyModel>> {
    try {
      const docRef = doc(db, 'journeys', id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return Result.failure(new AppError('NOT_FOUND', `Journey with ID ${id} not found`));
      }
      return Result.success(snapshot.data() as JourneyModel);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', `Failed to retrieve journey with ID ${id}`, err));
    }
  }

  public async updateRoute(id: string, point: JourneyRoutePoint): Promise<Result<void>> {
    try {
      const docRef = doc(db, 'journeys', id);
      await updateDoc(docRef, {
        route: arrayUnion(point),
      });
      return Result.success(undefined);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', `Failed to append route point to journey ${id}`, err));
    }
  }

  public async getActiveJourney(userId: string): Promise<Result<JourneyModel | null>> {
    try {
      const journeysRef = collection(db, 'journeys');
      const q = query(
        journeysRef,
        where('userId', '==', userId),
        where('status', '==', 'ACTIVE'),
        limit(1)
      );
      const snapshots = await getDocs(q);
      if (snapshots.empty) {
        return Result.success(null);
      }
      const activeDoc = snapshots.docs[0];
      return Result.success(activeDoc.data() as JourneyModel);
    } catch (err) {
      return Result.failure(new AppError('PERSISTENCE_ERROR', `Failed to search active journey for user ${userId}`, err));
    }
  }
}
