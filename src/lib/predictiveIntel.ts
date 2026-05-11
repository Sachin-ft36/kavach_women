/**
 * 🛰️ KAVACH PREDICTIVE INTELLIGENCE ENGINE (v4.0)
 * --------------------------------------------
 * This utility handles high-fidelity vector projection and path drift analysis.
 * Transitioning from client-side simulation to Cloud ML serverless pipeline.
 */

export interface JourneyVector {
  lat: number;
  lng: number;
  timestamp: any;
}

export interface PredictiveIntelResult {
  projection: [number, number][];
  isBreached: boolean;
  isWarning: boolean;
  deviationDist: string;
  bearing: string;
  speed: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * 🛰️ CLOUD ML HANDSHAKE (Simulated)
 * In production, this will perform a POST request to /api/ml/analyze-vector
 */
export const fetchPredictiveIntel = async (
  currentPath: JourneyVector[], 
  safePath: JourneyVector[]
): Promise<PredictiveIntelResult | null> => {
  if (currentPath.length < 2) return null;

  // 📡 TACTICAL TELEMETRY EXTRACTION
  const p1 = currentPath[currentPath.length - 2];
  const p2 = currentPath[currentPath.length - 1];
  
  const lat = p2.lat;
  const lng = p2.lng;
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;

  // 🎯 HIGH-FIDELITY VECTOR PROJECTION (60s Horizon)
  const projection: [number, number][] = [
    [lng, lat],
    [lng + dx * 5, lat + dy * 5],
    [lng + dx * 10, lat + dy * 10]
  ];

  // 🛡️ PROTOCOL DEVIATION ANALYSIS
  let minSafeDist = Infinity;
  if (safePath && safePath.length > 0) {
    safePath.forEach((sp) => {
      const d = Math.sqrt(Math.pow(sp.lng - lng, 2) + Math.pow(sp.lat - lat, 2));
      if (d < minSafeDist) minSafeDist = d;
    });
  }

  // ⚖️ THRESHOLD GATING (0.005 deg approx 500m)
  const isBreached = minSafeDist > 0.005 && safePath.length > 0;
  const isWarning = minSafeDist > 0.002 && safePath.length > 0 && !isBreached;

  // 🧬 THREAT CLASSIFICATION
  let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (isBreached) threatLevel = 'CRITICAL';
  else if (isWarning) threatLevel = 'HIGH';
  else if (minSafeDist > 0.001) threatLevel = 'MEDIUM';

  return {
    projection,
    isBreached,
    isWarning,
    deviationDist: (minSafeDist * 111).toFixed(2), // km approx
    bearing: (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(0),
    speed: (Math.sqrt(dx * dx + dy * dy) * 10000).toFixed(0),
    threatLevel
  };
};
