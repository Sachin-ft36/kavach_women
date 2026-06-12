import { useState, useEffect, useRef } from 'react';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // returns meters
};

export function useMapboxTelemetry(
  selectedAlertId: string | null | undefined,
  activeAlerts: any[],
  activeProtectors: any[]
) {
  const [metrics, setMetrics] = useState<{
    distance: string;
    eta: string;
    isStale: boolean;
    staleTimer: number;
  }>({ distance: 'Calculating...', eta: 'Calculating...', isStale: false, staleTimer: 0 });

  const lastResponderStateRef = useRef<{
    lat: number;
    lng: number;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (!selectedAlertId) {
      setMetrics({ distance: 'Calculating...', eta: 'Calculating...', isStale: false, staleTimer: 0 });
      lastResponderStateRef.current = null;
      return;
    }

    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert) return;

    const vLat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
    const vLng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;

    if (!vLat || !vLng) return;

    const responders = alert.activeResponders || [];
    if (responders.length === 0) {
      setMetrics({ distance: 'Awaiting Responders...', eta: 'N/A', isStale: false, staleTimer: 0 });
      lastResponderStateRef.current = null;
      return;
    }

    const responderId = responders[0].id || responders[0].uid;
    const p = activeProtectors.find(p => p.id === responderId);
    if (!p) {
      setMetrics({ distance: 'Responders En Route...', eta: 'Calculating...', isStale: false, staleTimer: 0 });
      return;
    }

    const pLat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
    const pLng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;

    if (!pLat || !pLng) return;

    const distMeters = calculateDistance(pLat, pLng, vLat, vLng);
    const distStr = distMeters < 1000 ? `${distMeters.toFixed(0)} meters` : `${(distMeters / 1000).toFixed(1)} km`;

    const speedKmh = Math.max(p.speed || 0, 35);
    const speedMs = speedKmh * (1000 / 3600);
    const etaSec = distMeters / speedMs;
    const etaMins = Math.floor(etaSec / 60);
    const etaRemainingSec = Math.floor(etaSec % 60);
    const etaStr = etaMins > 0 ? `${etaMins}m ${etaRemainingSec}s` : `${etaRemainingSec}s`;

    const now = Date.now();
    let isStale = false;
    let staleSec = 0;

    if (lastResponderStateRef.current) {
      const prev = lastResponderStateRef.current;
      if (Math.abs(prev.lat - pLat) < 0.00001 && Math.abs(prev.lng - pLng) < 0.00001) {
        staleSec = Math.floor((now - prev.timestamp) / 1000);
        if (staleSec >= 45) {
          isStale = true;
        }
      } else {
        lastResponderStateRef.current = { lat: pLat, lng: pLng, timestamp: now };
      }
    } else {
      lastResponderStateRef.current = { lat: pLat, lng: pLng, timestamp: now };
    }

    setMetrics({
      distance: distStr,
      eta: etaStr,
      isStale,
      staleTimer: staleSec
    });

    if (isStale) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 880;
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) { }
    }

  }, [selectedAlertId, activeAlerts, activeProtectors]);

  return { metrics };
}
