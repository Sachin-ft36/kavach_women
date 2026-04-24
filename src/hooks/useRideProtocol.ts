import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { executeEmergencyBlast } from '../services/sosService';

export function useRideProtocol() {
  const { isRideModeActive, rideData, updateRideData, userPos, user } = useKavachStore();
  const lastPosRef = useRef<[number, number] | null>(null);
  const consecutiveStopsRef = useRef(0);
  const baselineDistRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRideModeActive || !rideData || !rideData.targetCoords) return;

    // Check interval every 10 seconds for route drift and stationary threats
    const interval = setInterval(() => {
      const distToTarget = calculateHaversineDistance(
        userPos[0], userPos[1],
        rideData.targetCoords![0], rideData.targetCoords![1]
      );

      let deviation = 0;
      if (baselineDistRef.current !== null) {
        // If distance to target is INCREASING, we are deviating
        if (distToTarget > baselineDistRef.current + 0.1) { // 100m extra away
          deviation = distToTarget - baselineDistRef.current;
        } else {
          // Getting closer or staying roughly same implies no deviation
          baselineDistRef.current = Math.min(baselineDistRef.current, distToTarget);
        }
      } else {
        baselineDistRef.current = distToTarget;
      }

      // 1. Wrong Direction Edge Case (Auto-SOS if deviating > 2km continuously)
      if (deviation > 2.0 && rideData.warningsIssued === 0) {
        updateRideData({ deviationDistance: deviation, warningsIssued: 1 });
        executeEmergencyBlast(user, userPos, { type: 'ROUTE_DEVIATION_BREACH' });
        return; // Halt further checks
      }

      // 2. Bangalore Traffic Jam vs Dark Alley Handling (Smart Stationary Stop)
      if (lastPosRef.current) {
        const movedDist = calculateHaversineDistance(
          userPos[0], userPos[1],
          lastPosRef.current[0], lastPosRef.current[1]
        );

        if (movedDist < 0.05) { // Moved less than 50 meters in 10 seconds -> Stationary
          consecutiveStopsRef.current += 1;
        } else {
          consecutiveStopsRef.current = 0; // Reset if moving
        }

        // Over 5 mins completely stationary (30 intervals * 10s = 300s = 5m)
        if (consecutiveStopsRef.current > 30) {
          // Are we ON route or OFF route?
          if (deviation > 0.5) { // Off route by 500m AND stationary for 5m -> Highly suspicious
            if (rideData.warningsIssued === 0) {
              updateRideData({ warningsIssued: 1 });
              // Issue a soft local warning via system prompt (Haptic silent in real native app)
              const isSafe = window.confirm("⚠️ KAVACH Threat Monitor: You have been stationary off-route for 5 minutes. Are you safe? (Click Cancel to Trigger SOS)");
              if (!isSafe) {
                executeEmergencyBlast(user, userPos, { type: 'STATIONARY_THREAT_LOCK' });
              } else {
                consecutiveStopsRef.current = 0; // Reset if marked safe
              }
            }
          } else {
             // If ON route (deviation < 500m), it's just heavy Bangalore traffic. Suppress.
             console.log("KAVACH: Assuming heavy traffic block on-route. Suppressing false alarm.");
          }
        }
      }

      lastPosRef.current = userPos;
      updateRideData({ deviationDistance: deviation });
      
    }, 10000); // 10s interval

    return () => clearInterval(interval);
  }, [isRideModeActive, rideData?.targetCoords, userPos]); // Deliberately lightweight dependencies

  return null;
}
