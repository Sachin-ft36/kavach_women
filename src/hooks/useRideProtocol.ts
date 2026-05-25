import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { executeEmergencyBlast } from '../services/sosService';

/**
 * 🛰️ KAVACH RIDE MONITORING PROTOCOL
 * Automatically monitors transit paths via spatial geofence telemetry.
 * Leverages thread-safe reference caching to prevent state-change race conditions.
 */
export function useRideProtocol() {
  const { 
    isRideModeActive, 
    rideData, 
    updateRideData, 
    userPos, 
    user, 
    setSOSActive, 
    setActiveTab, 
    isSOSBlocked 
  } = useKavachStore();

  // Unified operational state tracking references
  const userPosRef = useRef(userPos);
  const lastPosRef = useRef<[number, number] | null>(null);
  const consecutiveStopsRef = useRef(0);
  const baselineDistRef = useRef<number | null>(null);
  const loopIntervalRef = useRef<any>(null);

  // Sync the latest coordinates to a reference cell to decouple from the effect loop
  useEffect(() => {
    userPosRef.current = userPos;
  }, [userPos]);

  useEffect(() => {
    // Teardown any running tracking instances if parameters are invalidated
    if (!isRideModeActive || !rideData || !rideData.targetCoords || isSOSBlocked) {
      clearActiveTrackingEngine();
      return;
    }

    // Capture initial values safely
    const targetCoordinates = rideData.targetCoords;
    const warningsIssued = rideData.warningsIssued || 0;

    // Prevent duplicate loop allocations
    if (loopIntervalRef.current) return;

    console.log("🚀 KAVACH: Ride Transit Monitoring Engine Active.");

    loopIntervalRef.current = setInterval(async () => {
      const currentPos = userPosRef.current;
      if (!currentPos || !currentPos[0] || !currentPos[1]) return;

      // 1. Calculate linear spatial distance to target destination
      const distToTarget = calculateHaversineDistance(
        currentPos[0], currentPos[1],
        targetCoordinates[0], targetCoordinates[1]
      );

      let deviation = 0;
      
      if (baselineDistRef.current !== null) {
        // If the user moves further away from their closest captured distance marker
        if (distToTarget > baselineDistRef.current + 0.15) { 
          deviation = distToTarget - baselineDistRef.current;
        } else {
          // Track the closest point the user has achieved along the route
          baselineDistRef.current = Math.min(baselineDistRef.current, distToTarget);
        }
      } else {
        baselineDistRef.current = distToTarget;
      }

      // Update the telemetry store data without triggering a component re-render
      updateRideData({ deviationDistance: deviation });

      // 🚨 CRITICAL BREACH: Off-Route Deviation Detection
      // A 2.5km vector drift indicates a complete exit from verified transit corridors
      if (deviation > 2.5 && warningsIssued === 0) {
        triggerEmergencyPipeline('ROUTE_DEVIATION_BREACH');
        return;
      }

      // 🚨 STATIONARY THREAT MONITORING
      if (lastPosRef.current) {
        const distanceMovedSinceLastCheck = calculateHaversineDistance(
          currentPos[0], currentPos[1],
          lastPosRef.current[0], lastPosRef.current[1]
        );

        // If the vehicle has traveled less than 40 meters while off-route, flag it as stopped
        if (distanceMovedSinceLastCheck < 0.04 && deviation > 0.4) { 
          consecutiveStopsRef.current += 1;
          console.warn(`⚠️ KAVACH: Suspicious transit stop detected. Counter: ${consecutiveStopsRef.current}/30`);
        } else {
          consecutiveStopsRef.current = 0; 
        }

        // 30 intervals * 10 seconds = 5 continuous minutes of zero velocity
        if (consecutiveStopsRef.current >= 30) {
          if (warningsIssued === 0) {
            triggerEmergencyPipeline('STATIONARY_SUSPICIOUS_STOP');
            return;
          }
        }
      }

      // Update historical reference tracks for the next comparison pass
      lastPosRef.current = [currentPos[0], currentPos[1]];
      
    }, 10000); // Evaluates every 10 seconds

    function triggerEmergencyPipeline(reason: 'ROUTE_DEVIATION_BREACH' | 'STATIONARY_SUSPICIOUS_STOP') {
      console.error(`🚨 KAVACH TRANSIT BLOCK: SOS TRIGGERED via ${reason}`);
      
      clearActiveTrackingEngine();
      updateRideData({ warningsIssued: 1 });
      
      setActiveTab('sos');
      setSOSActive(true, null, 'ride');
      
      executeEmergencyBlast(user, userPosRef.current, { type: reason });
    }

    function clearActiveTrackingEngine() {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
    }

    return () => {
      clearActiveTrackingEngine();
    };
    // Isolated dependencies preserve the interval instance across coordinates stream changes
  }, [isRideModeActive, rideData?.targetCoords, isSOSBlocked]);

  return null;
}
