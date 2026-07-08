import { Result } from '../../../shared/Result';

export interface JourneyRoutePoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface JourneyModel {
  id: string;
  userId: string;
  status: 'READY' | 'ACTIVE' | 'COMPLETED' | 'DEVIATED';
  route: JourneyRoutePoint[];
  startAddress?: string;
  destinationAddress?: string;
  startTime: number;
  endTime?: number;
}

export interface IJourneyRepository {
  save(journey: JourneyModel): Promise<Result<void>>;
  findById(id: string): Promise<Result<JourneyModel>>;
  updateRoute(id: string, point: JourneyRoutePoint): Promise<Result<void>>;
  getActiveJourney(userId: string): Promise<Result<JourneyModel | null>>;
}
