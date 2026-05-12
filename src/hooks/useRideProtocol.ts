import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { executeEmergencyBlast } from '../services/sosService';

export function useRideProtocol() {
  const { isRideModeActive, rideData, updateRideData, userPos, user, setSOSActive, setActiveTab, isSOSBlocked } = useKavachStore();
  const lastPosRef = useRef<[number, number] | null>(null);
  const consecutiveStopsRef = useRef(0);
  const baselineDistRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRideModeActive || !rideData || !rideData.targetCoords || isSOSBlocked) return;

    const interval = setInterval(() => {
      const distToTarget = calculateHaversineDistance(
        userPos[0], userPos[1],
        rideData.targetCoords![0], rideData.targetCoords![1]
      );

      let deviation = 0;
      if (baselineDistRef.current !== null) {
        if (distToTarget > baselineDistRef.current + 0.15) { 
          deviation = distToTarget - baselineDistRef.current;
        } else {
          baselineDistRef.current = Math.min(baselineDistRef.current, distToTarget);
        }
      } else {
        baselineDistRef.current = distToTarget;
      }

      // 🚨 HARD BREACH: Off route -> Instant Siren & Dispatch
      if (deviation > 2.0 && rideData.warningsIssued === 0) {
        updateRideData({ warningsIssued: 1 });
        setActiveTab('sos');
        setSOSActive(true, null, 'ride'); // Trigger SOS with 'ride' method
        executeEmergencyBlast(user, userPos, { type: 'ROUTE_DEVIATION_BREACH' });
        return;
      }

      // 🚨 STATIONARY THREAT: 5 mins off-route stop -> Siren & Dispatch
      if (lastPosRef.current) {
        const movedDist = calculateHaversineDistance(
          userPos[0], userPos[1],
          lastPosRef.current[0], lastPosRef.current[1]
        );

        if (movedDist < 0.05 && deviation > 0.4) { 
          consecutiveStopsRef.current += 1;
        } else {
          consecutiveStopsRef.current = 0; 
        }

        if (consecutiveStopsRef.current > 30) {
          if (rideData.warningsIssued === 0) {
            updateRideData({ warningsIssued: 1 });
            setActiveTab('sos');
            setSOSActive(true, null, 'ride'); // Trigger SOS with 'ride' method
            executeEmergencyBlast(user, userPos, { type: 'STATIONARY_SUSPICIOUS_STOP' });
          }
        }
      }

      lastPosRef.current = userPos;
      updateRideData({ deviationDistance: deviation });
      
    }, 10000);

    return () => {
      clearInterval(interval);
      baselineDistRef.current = null;
      consecutiveStopsRef.current = 0;
    };
  }, [isRideModeActive, rideData?.targetCoords, userPos, isSOSBlocked]);

  return null;
}
