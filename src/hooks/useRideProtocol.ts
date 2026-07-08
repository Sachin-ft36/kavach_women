import { useEffect, useRef } from 'react';
import { useKavachStore } from '../state/useKavachStore';
import { calculateHaversineDistance, distanceToPolylineMeters, fetchMapboxRoute } from '../utils/geoUtils';
import { KavachSafe } from '../services/KavachNative';
import { startBackgroundTracking } from '../services/locationService';
import { auth } from '../firebase';

/**
 * 🛰️ KAVACH RIDE MONITORING PROTOCOL (Phase 2 - GeoFencing)
 * Automatically monitors transit paths via spatial geofence telemetry using Polyline geometry.
 */
export function useRideProtocol() {
  const { 
    isRideModeActive, 
    rideData, 
    updateRideData, 
    userPos, 
    isSOSBlocked,
    isRideDeviationAlertActive,
    setIsRideDeviationAlertActive,
    isSOSActive
  } = useKavachStore();

  const userPosRef = useRef(userPos);
  const lastPosRef = useRef<[number, number] | null>(null);
  const consecutiveStopsRef = useRef(0);
  const baselineDistRef = useRef<number | null>(null);
  const loopIntervalRef = useRef<any>(null);

  useEffect(() => {
    userPosRef.current = userPos;
  }, [userPos]);

  useEffect(() => {
    // If Ride Mode is off, SOS is blocked, OR an active SOS is already running, shut down the background telemetry
    if (!isRideModeActive || !rideData || !rideData.targetCoords || isSOSBlocked || isSOSActive) {
      clearActiveTrackingEngine();
      return;
    }

    const targetCoordinates = rideData.targetCoords; // [lng, lat]
    const warningsIssued = rideData.warningsIssued || 0;

    // Fetch optimal routing polyline if not already mapped
    if (!rideData.plannedRoute || rideData.plannedRoute.length === 0) {
      const initRoute = async () => {
        const startLng = userPosRef.current?.lng;
        const startLat = userPosRef.current?.lat;
        const endLng = targetCoordinates?.[0];
        const endLat = targetCoordinates?.[1];

        if (!startLng || !startLat || !endLng || !endLat || isNaN(startLng) || isNaN(startLat) || isNaN(endLng) || isNaN(endLat)) {
          console.warn("🛰️ KAVACH Geofencing: Skipping route generation due to invalid or missing coordinates:", { startLng, startLat, endLng, endLat });
          return;
        }

        console.log("🛰️ Fetching Tactical Route Polyline for Geofencing via Mapbox (Web CORS Fallback)...");
        const path = await fetchMapboxRoute(startLng, startLat, endLng, endLat);
        if (path) {
          // 📡 BLIND-SPOT PREDICTION (Dead Zone Protocol)
          // Analyze the fetched route against a database of known Cellular Dead Zones (Forests, Valleys, Highways)
          // (In production: this queries Telco Coverage Maps / Network APIs)
          const routeHasDeadZones = false; // Mocking Telco Coverage API
          
          if (routeHasDeadZones) {
             console.warn("⚠️ KAVACH DEAD ZONE PROTOCOL: Route intersects with known Cellular Blind-Spots.");
             console.warn("📡 Pre-emptively dispatching Shadow Tracker payload to SuperCell...");
             // In production: Dispatch a 'dead-zone-entry' payload to Firebase with ETA. 
             // If the device does not ping back within ETA + 5 mins, SuperCell triggers a silent SOS automatically.
          }

          updateRideData({ plannedRoute: path.map(p => ({ lng: p[0], lat: p[1] })) });
        }
      };
      initRoute();
    }

    if (loopIntervalRef.current) return;
    console.log("🚀 KAVACH: Advanced Route GeoFencing Engine Active.");

    // 🛡️ NATIVE BACKGROUND BINDING (OS LEVEL)
    // Links this logic to the native Android/iOS background service to prevent OS from killing the CPU/GPS when minimized.
    KavachSafe.startBackgroundSentinel();
    if (auth.currentUser) {
      startBackgroundTracking(auth.currentUser.uid, 'high');
    }

    loopIntervalRef.current = setInterval(async () => {
      const state = useKavachStore.getState();
      
      // Do not process movement if the Dead Man's Switch interrogation is already active or SOS is running
      if (state.isRideDeviationAlertActive || state.isSOSActive) return;

      // Respect the 10-minute grace period after a user provides a valid reason
      if (state.rideGracePeriodEndsAt && Date.now() < state.rideGracePeriodEndsAt) {
        // Still track path to re-calculate route, but DO NOT trigger alarms
        // We will just return early to prevent triggering
        return;
      }

      const currentPos = userPosRef.current;
      if (!currentPos || !currentPos.lat || !currentPos.lng) return;

      let deviation = 0;
      const plannedRoute = useKavachStore.getState().rideData?.plannedRoute;

      if (plannedRoute && plannedRoute.length > 0) {
        // High-accuracy Polyline Geofencing
        // currentPos is { lat, lng }, distanceToPolyline expects (px=lng, py=lat)
        const distanceMeters = distanceToPolylineMeters(currentPos.lng, currentPos.lat, plannedRoute.map(p => [p.lng, p.lat] as [number, number]));
        deviation = distanceMeters / 1000; // Convert to KM
      } else {
        // Fallback: Anchor Mode (Linear drift)
        const distToTarget = calculateHaversineDistance(
          currentPos.lat, currentPos.lng,
          targetCoordinates[1], targetCoordinates[0] // Note: target is [lng, lat]
        );
        if (baselineDistRef.current !== null) {
          if (distToTarget > baselineDistRef.current + 0.15) { 
            deviation = distToTarget - baselineDistRef.current;
          } else {
            baselineDistRef.current = Math.min(baselineDistRef.current, distToTarget);
          }
        } else {
          baselineDistRef.current = distToTarget;
        }
      }

      updateRideData({ deviationDistance: deviation });

      // 🚨 STATIONARY MONITORING & SPEED PROFILING
      if (lastPosRef.current) {
        const distanceMovedSinceLastCheck = calculateHaversineDistance(
          currentPos.lat, currentPos.lng,
          lastPosRef.current[0], lastPosRef.current[1]
        );

        // 🏎️ HOSTILE EVASION MANEUVER (Kidnapping Speed & Aggressive U-Turns)
        // Speed = Distance(km) / Time(hours). The interval is 10 seconds (10 / 3600 hours)
        const currentSpeedKmh = distanceMovedSinceLastCheck * 360; 
        const isAggressiveUturn = false; // Mocking Gyroscope/Compass rapid heading change API

        // If deviating even slightly (100m) but fleeing at high speed (100+ km/h) or taking violent U-turns
        if ((deviation > 0.1 && currentSpeedKmh > 100) || isAggressiveUturn) {
          console.error("🚨 KAVACH HOSTILE EVASION DETECTED: Kidnapping/Fleeing pattern matched!");
          triggerDeadMansSwitch('ROUTE_DEVIATION_BREACH');
          return;
        }

        // 🚨 STANDARD DEVIATION DETECTION: > 500 meters (0.5 km) off the polyline route
        if (deviation > 0.5 && warningsIssued === 0) {
          triggerDeadMansSwitch('ROUTE_DEVIATION_BREACH');
          return;
        }

        // If moved < 40 meters (0.04 km)
        if (distanceMovedSinceLastCheck < 0.04) { 
          consecutiveStopsRef.current += 1;
        } else {
          consecutiveStopsRef.current = 0; 
        }

        // 🚥 CONTEXT-AWARE THREAT ANALYSIS (Traffic Density & POI Integration)
        // (In production, this queries Mapbox/Mappls live traffic API and Places API)
        const trafficDensity = 'CLEAR_ROAD'; // Mocking Traffic API
        const isNearSafePOI = false; // Mocking POI API (Toll Plaza, Petrol Pump, Police Station)
        
        let stopThresholdIntervals = 30; // Default: 5 Mins for Heavy Traffic / Red Zones
        
        if (isNearSafePOI) {
          // If stopped at a Toll Plaza or Petrol Pump, allow extra time without triggering alarm
          stopThresholdIntervals = 45; // 7.5 Minutes (Toll lines can be long)
        } else if (trafficDensity === 'CLEAR_ROAD') {
          // If the road has NO traffic (green line) and it's NOT a safe POI, there is ZERO reason to stop.
          // Reduce the threat timer to just 90 seconds (9 intervals).
          stopThresholdIntervals = 9;
        }

        // 🛡️ INITIAL START GRACE PERIOD
        // If the ride just started (within 5 mins), the user might be waiting in the cab before it departs.
        // Prevent the 90-second clear road alarm from triggering too early.
        const timeSinceRideStart = Date.now() - (rideData.startTime || Date.now());
        if (timeSinceRideStart < 5 * 60 * 1000) {
          stopThresholdIntervals = Math.max(stopThresholdIntervals, 30); // Enforce at least 5 mins
        }

        if (consecutiveStopsRef.current >= stopThresholdIntervals) {
          if (warningsIssued === 0) {
            triggerDeadMansSwitch('STATIONARY_SUSPICIOUS_STOP');
            return;
          }
        }
      }

      lastPosRef.current = [currentPos.lat, currentPos.lng];
    }, 10000);

    function triggerDeadMansSwitch(reason: 'ROUTE_DEVIATION_BREACH' | 'STATIONARY_SUSPICIOUS_STOP') {
      console.error(`🚨 KAVACH DEAD MAN'S SWITCH: Triggered via ${reason}`);
      setIsRideDeviationAlertActive(true, reason);
    }

    function clearActiveTrackingEngine() {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
      
      // Stop native background processes when ride is cleared
      KavachSafe.stopBackgroundSentinel();
      
      lastPosRef.current = null;
      baselineDistRef.current = null;
      consecutiveStopsRef.current = 0;
    }

    return () => {
      clearActiveTrackingEngine();
    };
  }, [isRideModeActive, rideData?.targetCoords, rideData?.plannedRoute?.length, isSOSBlocked, isSOSActive]);

  return null;
}
