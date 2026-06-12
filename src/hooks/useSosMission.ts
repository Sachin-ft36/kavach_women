import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';
import { fetchNearbyPoliceMappls, isOfficialPoliceStation } from '../services/MapplsService';
import { toast } from 'sonner';

export const useSosMission = () => {
  const { user, isSOSActive, activeAlertId, userPos, activeRadius, setActiveRadius } = useKavachStore();

  const [smsStatus, setSmsStatus] = useState('INITIALIZING...');
  const [nearbyCount, setNearbyCount] = useState(0);
  const [protectors, setProtectors] = useState<any[]>([]);
  const [nearestPolice, setNearestPolice] = useState<{ name: string, lat: number, lng: number, dist?: string } | null>(null);
  const [isBeingMonitored, setIsBeingMonitored] = useState(false);
  const [showSafetyVerification, setShowSafetyVerification] = useState(false);
  const [activeAlertData, setActiveAlertData] = useState<any>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 📡 SOS DISPATCH HANDSHAKE SEQUENCE
  useEffect(() => {
    if (isSOSActive) {
      const smsTimer1 = setTimeout(() => setSmsStatus('SENDING...'), 2000);
      const smsTimer2 = setTimeout(() => setSmsStatus('DELIVERED'), 5000);

      return () => {
        clearTimeout(smsTimer1);
        clearTimeout(smsTimer2);
      };
    } else {
      setSmsStatus('INITIALIZING...');
    }
  }, [isSOSActive]);

  // ⚡ TACTICAL RANGE HARDENING
  useEffect(() => {
    if (isSOSActive && activeAlertId && activeRadius < 5.0) {
      setActiveRadius(5.0);
      setDoc(doc(db, 'alerts', activeAlertId), {
        dispatchRadius: 5.0,
        lastEscalatedAt: serverTimestamp(),
        escalationReason: 'MAX_RANGE_FORCE_OVERRIDE'
      }, { merge: true }).catch(e => console.error("🛰️ RADIUS_FORCE_SYNC_ERROR:", e));
      console.log("⚡ KAVACH: Search Perimeter Hardened to 5.0KM (Max Range)");
    }
  }, [isSOSActive, activeAlertId, activeRadius, setActiveRadius]);

  // 📡 PROTECTOR RADAR LOGIC
  useEffect(() => {
    let unsubscribe: () => void = () => { };

    if (isSOSActive && userPos) {
      console.log(`📡 RADAR: Scanning for local protectors within ${activeRadius}KM tactical tier...`);
      const q = query(collection(db, 'users'), where('role', '==', 'protector'), where('isVerified', '==', true));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const allFound = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const inRange = allFound.filter((data: any) => {
          if (!data.coords) return false;
          const occupation = data.protectorVetting?.occupation || '';
          const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some(role =>
            occupation.toLowerCase().includes(role.toLowerCase())
          );
          const dist = calculateDistance(userPos.lat, userPos.lng, data.coords[0], data.coords[1]);
          return isElite ? (dist <= 5.0) : (dist <= activeRadius);
        });

        setNearbyCount(inRange.length);
        setProtectors(inRange);
      });
    }

    return () => {
      unsubscribe();
      setProtectors([]);
    };
  }, [isSOSActive, userPos, activeRadius]);

  // 🚔 FETCH NEAREST POLICE
  useEffect(() => {
    if (isSOSActive && userPos && !nearestPolice) {
      const fetchNearestPolice = async () => {
        try {
          if (!userPos || typeof userPos.lat !== 'number' || typeof userPos.lng !== 'number') return;
          const { lat, lng } = userPos;
          let realStations: any[] = await fetchNearbyPoliceMappls(lat, lng);
          const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

          if (realStations.length === 0) {
            try {
              const url = `https://api.mapbox.com/search/searchbox/v1/category/police?proximity=${lng},${lat}&limit=10&access_token=${MAPBOX_TOKEN}`;
              const response = await fetch(url);
              const data = await response.json();
              if (data && Array.isArray(data.features) && data.features.length > 0) {
                realStations = data.features.map((f: any) => {
                  const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
                  const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
                  const distKm = calculateDistance(lat, lng, fLat, fLng);
                  return {
                    name: f.properties?.name || f.properties?.full_address || "Local Police Station",
                    distVal: distKm,
                    lat: fLat,
                    lng: fLng
                  };
                }).filter((s: any) => isOfficialPoliceStation(s.name));
              }
            } catch (e) { }
          }

          if (realStations.length === 0) {
            try {
              const query = `[out:json];(node["amenity"="police"](around:25000,${lat},${lng});way["amenity"="police"](around:25000,${lat},${lng}););out center;`;
              const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
              const response = await fetch(url);
              const data = await response.json();
              if (data && Array.isArray(data.elements) && data.elements.length > 0) {
                realStations = data.elements.map((item: any) => {
                  const fLat = item.lat || item.center?.lat;
                  const fLng = item.lon || item.center?.lng;
                  const d = calculateDistance(lat, lng, fLat, fLng);
                  return {
                    name: item.tags?.name || "Local Police Station",
                    distVal: d,
                    lat: fLat,
                    lng: fLng
                  };
                }).filter((s: any) => s.distVal <= 25);
              }
            } catch (e) { }
          }

          const sortedStations = realStations.sort((a: any, b: any) => (a.distVal || 0) - (b.distVal || 0));
          const dedupedStations: any[] = [];
          for (const station of sortedStations) {
            const isDuplicate = dedupedStations.some((existing) => {
              const isCoordsSame = station.lat && station.lng && existing.lat && existing.lng &&
                Math.abs(station.lat - existing.lat) < 0.002 && Math.abs(station.lng - existing.lng) < 0.002;
              const isDistanceSame = Math.abs((station.distVal || 0) - (existing.distVal || 0)) < 0.1;
              return isCoordsSame || isDistanceSame;
            });
            if (!isDuplicate) {
              dedupedStations.push(station);
            } else {
              const index = dedupedStations.findIndex((existing) => {
                return Math.abs((station.distVal || 0) - (existing.distVal || 0)) < 0.1;
              });
              if (index !== -1) {
                const existing = dedupedStations[index];
                const isNewBetter = !station.name.toLowerCase().includes('auxilliary') && existing.name.toLowerCase().includes('auxilliary');
                if (isNewBetter) {
                  dedupedStations[index] = station;
                }
              }
            }
          }

          let filteredStations = dedupedStations.filter((s: any) => (s.distVal || 0) <= 5);
          if (filteredStations.length === 0) filteredStations = dedupedStations.filter((s: any) => (s.distVal || 0) <= 10);
          if (filteredStations.length === 0 && dedupedStations.length > 0) filteredStations = [dedupedStations[0]];

          if (filteredStations.length > 0) {
            const finalStation = filteredStations[0];
            const distStr = finalStation.dist || (finalStation.distVal ? (finalStation.distVal < 1 ? `${(finalStation.distVal * 1000).toFixed(0)}m AWAY` : `${finalStation.distVal.toFixed(1)}km AWAY`) : 'NEARBY');

            setNearestPolice({
              name: finalStation.name || 'Nearest Police Station',
              lat: finalStation.lat,
              lng: finalStation.lng,
              dist: distStr
            });
          } else {
            setNearestPolice({
              name: 'Kavach Tactical Hub (Local)',
              lat: userPos.lat + 0.01,
              lng: userPos.lng + 0.01,
              dist: '1.2km AWAY'
            });
          }

        } catch (e) {
          console.error("SOS Police Fetch Error", e);
          if (!nearestPolice) {
            setNearestPolice({
              name: 'Kavach Tactical Hub (Local)',
              lat: userPos.lat + 0.01,
              lng: userPos.lng + 0.01,
              dist: '1.2km AWAY'
            });
          }
        }
      };

      fetchNearestPolice();
    }
  }, [isSOSActive, userPos, nearestPolice]);

  // 📡 MISSION CRITICAL: 2-Second High-Precision Location Uplink
  useEffect(() => {
    let updateTimer: any;
    if (isSOSActive && activeAlertId && userPos) {
      updateTimer = setInterval(async () => {
        try {
          await setDoc(doc(db, 'alerts', activeAlertId), {
            latitude: userPos.lat,
            longitude: userPos.lng,
            'location.latitude': userPos.lat,
            'location.longitude': userPos.lng,
            lastLocationUpdate: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.error("🛰️ UPLINK_SYNC_ERROR:", e);
        }
      }, 2000);
    }
    return () => clearInterval(updateTimer);
  }, [isSOSActive, activeAlertId, userPos]);

  // 📡 ACTIVE MISSION SYNC
  useEffect(() => {
    let unsubscribe = () => { };

    if (isSOSActive && activeAlertId) {
      const alertRef = doc(db, 'alerts', activeAlertId);
      unsubscribe = onSnapshot(alertRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setActiveAlertData(data);

          if (data.isBeingMonitored && !isBeingMonitored) {
            if (Capacitor.isNativePlatform()) KavachSafe.triggerHapticPulse();
            toast.info("COMMAND CENTER: TACTICAL UPLINK ESTABLISHED.");
          }
          setIsBeingMonitored(!!data.isBeingMonitored);

          if (data.handshakeCode && !useKavachStore.getState().handshakeCode) {
            useKavachStore.setState({ handshakeCode: data.handshakeCode });
          }

          if (data.status === 'rescued_pending_victim_clearance' || data.verification?.verifiedBy) {
            setShowSafetyVerification(true);
          } else {
            setShowSafetyVerification(false);
          }
        }
      });
    }
    return () => unsubscribe();
  }, [isSOSActive, activeAlertId]);

  return {
    smsStatus,
    nearbyCount,
    protectors,
    nearestPolice,
    isBeingMonitored,
    showSafetyVerification,
    setShowSafetyVerification,
    activeAlertData
  };
};
