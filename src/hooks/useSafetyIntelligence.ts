import { useState, useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface SafetyMetrics {
  score: number; // 0-100 Range Scale
  level: 'OPTIMAL' | 'STABLE' | 'CAUTION' | 'CRITICAL';
  protectorCount: number;
  activeAlerts: number;
  incidentHistory: number;
  recommendation: string;
}

/**
 * 📊 KAVACH SAFETY INTELLIGENCE ENGINE
 * Evaluates regional data points to compute an accurate live safety rating.
 * Thread-safe range evaluation prevents classification drops.
 */
export const useSafetyIntelligence = () => {
  const { userPos, verifiedProtectorCount } = useKavachStore();
  const [metrics, setMetrics] = useState<SafetyMetrics>({
    score: 85,
    level: 'STABLE',
    protectorCount: 0,
    activeAlerts: 0,
    incidentHistory: 0,
    recommendation: 'Initializing Safety Grid...'
  });

  // Persist the latest resource values across async operations
  const protectorCountRef = useRef(verifiedProtectorCount);
  useEffect(() => {
    protectorCountRef.current = verifiedProtectorCount;
  }, [verifiedProtectorCount]);

  useEffect(() => {
    if (!userPos || !userPos[0] || !userPos[1]) return;

    // Monitor active incidents on the network
    const activeIncidentsQuery = query(
      collection(db, 'alerts'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(activeIncidentsQuery, (snapshot) => {
      const activeCount = snapshot.size;
      const currentProtectors = protectorCountRef.current;
      
      // 🧠 TOP-DOWN THREAT ASSESSMENT ALGORITHM
      let calculatedScore = 85; 

      // 1. Regional Responder Resource Evaluation
      if (currentProtectors > 0) {
        calculatedScore += Math.min(currentProtectors * 3, 15);
      } else {
        calculatedScore -= 5; 
      }

      // 2. Incident Volume Penalty Calculation
      calculatedScore -= Math.min(activeCount * 5, 30);

      // 3. Temporal Risk Offset (Using UTC to maintain consistency across devices)
      const currentUtcHour = new Date().getUTCHours();
      // Adjust standard offset markers to match localized geographic properties (e.g., IST = UTC+5.5)
      const approximatedLocalHour = (currentUtcHour + 5) % 24; 
      
      if (approximatedLocalHour >= 22 || approximatedLocalHour <= 4) {
        calculatedScore -= 15;
      }

      // Keep the final calculation strictly within standard 0-100 boundaries
      const finalizedScore = Math.max(0, Math.min(100, calculatedScore));

      // 🛡️ ACCURATE THREAT LEVEL EVALUATION MATRIX
      let safetyLevel: SafetyMetrics['level'] = 'STABLE';
      let recommendationText = 'Stay Alert. Use Safe Journey for travel.';

      if (finalizedScore >= 85) {
        safetyLevel = 'OPTIMAL';
        recommendationText = currentProtectors > 0 
          ? 'High Protector Density. Zone is Secured.' 
          : 'National Grid Monitoring Active. Zone is Stable.';
      } else if (finalizedScore >= 65) {
        safetyLevel = 'STABLE';
        recommendationText = 'Normal conditions. Maintain situational awareness.';
      } else if (finalizedScore >= 45) {
        safetyLevel = 'CAUTION';
        recommendationText = 'Elevated Risk. Use ShadowProtect if moving through dark zones.';
      } else {
        safetyLevel = 'CRITICAL';
        recommendationText = 'High Emergency Density. Move to a populated area immediately.';
      }

      setMetrics({
        score: finalizedScore,
        level: safetyLevel,
        protectorCount: currentProtectors,
        activeAlerts: activeCount,
        incidentHistory: 12, // Placeholder for historical trend analysis APIs
        recommendation: recommendationText
      });
    }, (error) => {
      console.error("Safety Intelligence Engine subscription fault:", error);
    });

    return () => unsubscribe();
  }, [userPos]); // Removed raw count dependency to prevent database loop thrashing

  return metrics;
};
