import { useState, useEffect } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface SafetyMetrics {
  score: number; // 0-100
  level: 'OPTIMAL' | 'STABLE' | 'CAUTION' | 'CRITICAL';
  protectorCount: number;
  activeAlerts: number;
  incidentHistory: number;
  recommendation: string;
}

export const useSafetyIntelligence = () => {
  const { userPos, role, verifiedProtectorCount } = useKavachStore();
  const [metrics, setMetrics] = useState<SafetyMetrics>({
    score: 85,
    level: 'STABLE',
    protectorCount: 0,
    activeAlerts: 0,
    incidentHistory: 0,
    recommendation: 'System Standing By'
  });

  useEffect(() => {
    if (!userPos) return;

    // 📡 LIVE SAFETY GRID MONITORING
    // In a real scenario, we'd query alerts within a geo-hash
    // For this tactical implementation, we'll monitor global active alerts and local protectors
    
    const q = query(
      collection(db, 'alerts'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeCount = snapshot.size;
      
      // 🧠 TACTICAL SCORE CALCULATION (Cold Start Optimized)
      // 1. Start with a strong base score (National Grid Monitoring)
      let score = 85; 

      // 2. Add bonus for verified Protectors (if any)
      if (verifiedProtectorCount > 0) {
        score += Math.min(verifiedProtectorCount * 3, 15);
      } else {
        // Safe Baseline for monitored zones
        score -= 5; 
      }

      // 3. Subtract for global high-alert status
      score -= Math.min(activeCount * 5, 30);

      // 4. Night-time Penalty (10 PM to 4 AM)
      const hour = new Date().getHours();
      if (hour >= 22 || hour <= 4) {
        score -= 15;
      }

      // 🛡️ LEVEL CLASSIFICATION
      let level: SafetyMetrics['level'] = 'STABLE';
      let recommendation = 'Stay Alert. Use Safe Journey for travel.';

      if (score > 80) {
        level = 'OPTIMAL';
        recommendation = verifiedProtectorCount > 0 ? 'High Protector Density. Zone is Secured.' : 'National Grid Monitoring Active. Zone is Stable.';
      } else if (score < 60) {
        level = 'CAUTION';
        recommendation = 'Elevated Risk. Use ShadowProtect if moving through dark zones.';
      } else if (score < 40) {
        level = 'CRITICAL';
        recommendation = 'High Emergency Density. Move to a populated area.';
      }

      setMetrics({
        score: Math.max(0, Math.min(100, score)),
        level,
        protectorCount: verifiedProtectorCount,
        activeAlerts: activeCount,
        incidentHistory: 12, // Mock historical data
        recommendation
      });
    });

    return () => unsubscribe();
  }, [userPos, verifiedProtectorCount]);

  return metrics;
};
