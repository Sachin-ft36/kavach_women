import { Result } from '../../../shared/Result';

export interface GuardianModel {
  id: string;
  phone: string;
  name: string;
  relationship?: string;
  isOnline: boolean;
  lastActive: number;
}

export interface IGuardianRepository {
  add(userId: string, guardian: Omit<GuardianModel, 'isOnline' | 'lastActive'>): Promise<Result<void>>;
  remove(userId: string, guardianId: string): Promise<Result<void>>;
  list(userId: string): Promise<Result<GuardianModel[]>>;
  updateStatus(guardianId: string, isOnline: boolean): Promise<Result<void>>;
}
