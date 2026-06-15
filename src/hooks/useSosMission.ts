import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, doc, setDoc, arrayUnion } from 'firebase/firestore';
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

  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const [timerPulse, setTimerPulse] = useState(0);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ⏱️ 5-Second Periodic Pulse to drive age-based escalations
  useEffect(() => {
    let interval: any;
    if (isSOSActive) {
      interval = setInterval(() => {
        setTimerPulse(prev => prev + 1);
      }, 5000);
    }
    return () => {
      clearInterval(interval);
      setTimerPulse(0);
    };
  }, [isSOSActive]);

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

  // 📡 DATA SUBSCRIPTION: Listen to protectors and PCRs once during active SOS
  useEffect(() => {
    let unsubscribe: () => void = () => { };

    if (isSOSActive) {
      const q = query(
        collection(db, 'users'),
        where('role', 'in', ['protector', 'pcr_officer'])
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((p: any) => {
            if (p.role === 'protector') return p.isVerified === true;
            if (p.role === 'pcr_officer') return p.isOnDuty === true;
            return false;
          });
        setRawUsers(docs);
      }, (err) => {
        console.error("📡 DATA_SUBSCRIPTION_ERROR:", err);
      });
    } else {
      setRawUsers([]);
    }

    return () => unsubscribe();
  }, [isSOSActive]);

  const respondersStagnantRef = useRef<Record<string, { lat: number, lng: number, timestamp: number, isStagnant: boolean }>>({});
  const triggeredStagesRef = useRef<Set<number>>(new Set());
  const demotedRespondersRef = useRef<Set<string>>(new Set());
  const promotedCommanderRef = useRef<string | null>(null);

  // Reset triggered states when SOS goes inactive
  useEffect(() => {
    if (!isSOSActive) {
      triggeredStagesRef.current.clear();
      demotedRespondersRef.current.clear();
      promotedCommanderRef.current = null;
    }
  }, [isSOSActive]);

  // 🎯 TACTICAL ADAPTIVE RESOLUTION: Locks civilian radius to 0.5km if close units found, but escalates on timeout/stagnation. PCR vans always scanned up to 5km.
  useEffect(() => {
    if (!isSOSActive || !userPos) return;

    const allWithDistance = rawUsers.map((data: any) => {
      const lat = data.telemetry?.coords?.[0] || data.lastLocation?.lat || data.lastLocation?.latitude || data.latitude || (data.coords && data.coords[0]);
      const lng = data.telemetry?.coords?.[1] || data.lastLocation?.lng || data.lastLocation?.longitude || data.longitude || (data.coords && data.coords[1]);
      const dist = (lat && lng) ? calculateDistance(userPos.lat, userPos.lng, lat, lng) : null;
      return { ...data, distanceKm: dist };
    }).filter(d => d.distanceKm !== null);

    // Prioritize Area Defenders attached to the current incident's geofenced zones
    const sortedAssets = [...allWithDistance].sort((a, b) => {
      const aIsZoneDefender = a.isAreaDefender || a.profile?.isAreaDefender || false;
      const bIsZoneDefender = b.isAreaDefender || b.profile?.isAreaDefender || false;
      if (aIsZoneDefender && !bIsZoneDefender) return -1;
      if (!aIsZoneDefender && bIsZoneDefender) return 1;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    // Check if there's any civilian protector within 500m
    const civiliansWithin500m = sortedAssets.filter(d => d.role === 'protector' && d.distanceKm! <= 0.5);

    // Calculate age of the alert and responder responses
    const getAlertAge = () => {
      if (!activeAlertData?.createdAt) return 0;
      const createdTime = activeAlertData.createdAt.toMillis ? activeAlertData.createdAt.toMillis() : Number(activeAlertData.createdAt);
      return (Date.now() - createdTime) / 1000;
    };
    const alertAge = getAlertAge();
    const currentStage = activeAlertData?.escalationStage || 0;

    // Versioned Map Schema structure for responders
    const respondersMap = activeAlertData?.responders || {};
    const acceptedResponders = Object.keys(respondersMap).map(uid => ({ uid, ...respondersMap[uid] }));
    const hasAccepted = acceptedResponders.length > 0;
    const now = Date.now();

    // Helper to log audited timeline actions to a structured Subcollection event stream
    const writeAuditLog = async (event: string, details: string, stage: number, additionalFields: any = {}, once = false) => {
      if (!activeAlertId) return;
      const key = `${event}_${stage}`;
      if (once && triggeredStagesRef.current.has(key as any)) return;
      if (once) triggeredStagesRef.current.add(key as any);
      
      try {
        await setDoc(doc(db, 'alerts', activeAlertId), {
          ...additionalFields,
          escalationStage: stage,
          lastEscalatedAt: serverTimestamp()
        }, { merge: true });
        console.log(`📝 KAVACH AUDIT EVENT: ${event} - ${details}`);
      } catch (e) {
        console.error("📝 AUDIT_LOG_ERROR:", e);
      }
    };

    // ⏱️ PROGRESSIVE TIMELINE ESCALATION MANAGEMENT
    if (activeAlertId) {
      if (alertAge >= 90 && currentStage < 5) {
        writeAuditLog(
          'Search Perimeter Expanded',
          'Search perimeter expanded to 2.0KM for all active protectors due to response latency',
          5,
          { dispatchRadius: 2.0, pcrEscalationStatus: 'PERIMETER_EXPANDED', schemaVersion: 1 },
          true
        );
        if (activeRadius !== 2.0) {
          setActiveRadius(2.0);
        }
      } else if (alertAge >= 60 && currentStage < 4) {
        writeAuditLog(
          'Secondary PCR Dispatched',
          'Primary PCR failed to intercept within 60s, dispatching secondary backup',
          4,
          { secondaryPcrRequired: true, pcrEscalationStatus: 'SECONDARY_DISPATCHED', schemaVersion: 1 },
          true
        );
        toast.warning("⚠️ PRIMARY PCR UNRESPONSIVE. DISPATCHING SECONDARY POLICE VAN...");
      } else if (alertAge >= 40 && currentStage < 3) {
        writeAuditLog(
          'Supervisor Alerted',
          'Incident response latency exceeded 40s. Dispatching desk supervisor alert.',
          3,
          { pcrEscalationStatus: 'SUPERVISOR_NOTIFIED', schemaVersion: 1 },
          true
        );
      } else if (alertAge >= 25 && currentStage < 2) {
        writeAuditLog(
          'Primary PCR Delayed',
          'No acknowledgment received within 25s threshold.',
          2,
          { pcrEscalationStatus: 'DELAYED', schemaVersion: 1 },
          true
        );
      } else if (alertAge >= 15 && currentStage < 1) {
        writeAuditLog(
          'Reminder Ping Sent',
          'Dispatch latency warning ping sent to responder console.',
          1,
          { pcrEscalationStatus: 'REMINDER_SENT', schemaVersion: 1 },
          true
        );
      }
    }

    // 📡 MULTI-SIGNAL RESPONDER HEALTH MONITORING
    let anyPcrStagnant = false;
    let anyPcrNoHeartbeat = false;
    let anyCivilianStagnant = false;

    acceptedResponders.forEach((responder: any) => {
      const rId = responder.uid;
      const liveUser = rawUsers.find(u => u.id === rId || u.uid === rId);
      if (!liveUser) return;

      const liveLat = liveUser.telemetry?.coords?.[0] || liveUser.lastLocation?.lat || liveUser.lastLocation?.latitude || liveUser.latitude || (liveUser.coords && liveUser.coords[0]);
      const liveLng = liveUser.telemetry?.coords?.[1] || liveUser.lastLocation?.lng || liveUser.lastLocation?.longitude || liveUser.longitude || (liveUser.coords && liveUser.coords[1]);

      if (!liveLat || !liveLng) return;

      // 1. Heartbeat Check (Telemetry Update Latency)
      const lastUpdateMillis = liveUser.telemetry?.timestamp || (liveUser.lastUpdated?.toMillis ? liveUser.lastUpdated.toMillis() : Number(liveUser.lastUpdated)) || Date.now();
      const heartbeatAgeSec = (Date.now() - lastUpdateMillis) / 1000;
      const hasHeartbeat = heartbeatAgeSec <= 15;

      if (!hasHeartbeat) {
        if (liveUser.role === 'pcr_officer') {
          anyPcrNoHeartbeat = true;
        }
        console.warn(`🚨 KAVACH HEARTBEAT LOSS: Responder ${rId} lost heartbeat (${heartbeatAgeSec.toFixed(0)}s ago).`);
      }

      // 2. GPS Accuracy & Displacement Check
      const accuracy = liveUser.telemetry?.accuracy || 10;
      const record = respondersStagnantRef.current[rId];
      if (!record) {
        respondersStagnantRef.current[rId] = {
          lat: liveLat,
          lng: liveLng,
          timestamp: now,
          isStagnant: false
        };
      } else {
        const timeDiffSec = (now - record.timestamp) / 1000;
        if (timeDiffSec >= 30) {
          if (accuracy <= 100) {
            const distMovedKm = calculateDistance(record.lat, record.lng, liveLat, liveLng);
            const distMovedM = distMovedKm * 1000;

            if (distMovedM < 20) { // Stagnant if moved < 20m in 30s
              respondersStagnantRef.current[rId].isStagnant = true;
              console.warn(`🚨 KAVACH STAGGNANT: Responder ${rId} is stagnant (moved ${distMovedM.toFixed(1)}m).`);
            } else {
              respondersStagnantRef.current[rId] = {
                lat: liveLat,
                lng: liveLng,
                timestamp: now,
                isStagnant: false
              };
            }
          }
        }
        if (record.isStagnant) {
          if (liveUser.role === 'pcr_officer') {
            anyPcrStagnant = true;
          } else {
            anyCivilianStagnant = true;
          }
        }
      }
    });

    // Clean up tracking
    Object.keys(respondersStagnantRef.current).forEach(rId => {
      if (!acceptedResponders.some((r: any) => r.uid === rId)) {
        delete respondersStagnantRef.current[rId];
      }
    });

    // 🚔 PCR STAGGNANT/HEARTBEAT FAILURE TRIGGER
    if (activeAlertId && (anyPcrStagnant || anyPcrNoHeartbeat)) {
      if (currentStage < 4) {
        writeAuditLog(
          'Secondary PCR Dispatched (Fail-Safe)',
          anyPcrNoHeartbeat ? 'Primary PCR heartbeat lost (>15s), dispatching secondary backup' : 'Primary PCR stagnant GPS displacement, dispatching secondary backup',
          4,
          { secondaryPcrRequired: true, pcrEscalationStatus: 'SECONDARY_DISPATCHED', schemaVersion: 1 },
          true
        );
        toast.warning("⚠️ PRIMARY PCR UNRESPONSIVE (STAGGNANT/HEARTBEAT LOSS). DISPATCHING SECONDARY POLICE VAN...");
      }
    }

    // 🔄 CO-ORDINATED SWARM ROLE AUTO-PROMOTION CHAIN
    const primary = acceptedResponders.find(r => r.role === 'primary');
    const backup = acceptedResponders.find(r => r.role === 'backup');
    const standby = acceptedResponders.find(r => r.role === 'standby');

    if (primary && activeAlertId) {
      const pUid = primary.uid;
      const record = respondersStagnantRef.current[pUid];
      const livePrimary = rawUsers.find(u => u.id === pUid || u.uid === pUid);
      
      const lastUpdateMillis = livePrimary?.telemetry?.timestamp || (livePrimary?.lastUpdated?.toMillis ? livePrimary.lastUpdated.toMillis() : Number(livePrimary?.lastUpdated)) || Date.now();
      const heartbeatAgeSec = (Date.now() - lastUpdateMillis) / 1000;
      const hasHeartbeat = heartbeatAgeSec <= 15;

      const env = activeAlertData?.environment || 'urban';
      const graceWindow = env === 'campus' ? 30 : (env === 'highway' ? 45 : 60);

      const isStagnant = record?.isStagnant;
      const shouldDemote = (!hasHeartbeat && alertAge > graceWindow) || (isStagnant && !hasHeartbeat && alertAge > graceWindow);

      if (shouldDemote && !demotedRespondersRef.current.has(pUid)) {
        demotedRespondersRef.current.add(pUid);
        const updates: any = {};
        updates[`responders.${pUid}.role`] = 'standby_degraded';
        let details = `Primary responder ${pUid} demoted due to heartbeat loss/stagnation.`;

        if (backup) {
          updates[`responders.${backup.uid}.role`] = 'primary';
          details += ` Backup responder ${backup.uid} promoted to Primary.`;
          if (standby) {
            updates[`responders.${standby.uid}.role`] = 'backup';
            details += ` Standby responder ${standby.uid} promoted to Backup.`;
          }
        }

        setDoc(doc(db, 'alerts', activeAlertId), updates, { merge: true })
          .then(() => {
            writeAuditLog('Swarm Auto-Promotion Triggered', details, currentStage);
            toast.info("🚨 CO-ORDINATED SWARM: PRIMARY RESPONDER DEMOTED, BACKUP PROMOTED TO INTERCEPT!");
          })
          .catch(e => console.error("🛰️ SWARM_PROMOTION_ERROR:", e));
      }
    }

    // 🎓 INCIDENT COMMANDER SELECTION ALGORITHM (5+ active responders)
    if (acceptedResponders.length >= 5 && activeAlertId) {
      let bestScore = -1;
      let bestUid = '';

      acceptedResponders.forEach((responder: any) => {
        const liveUser = rawUsers.find(u => u.id === responder.uid || u.uid === responder.uid);
        const trustScore = liveUser?.trustScore || 80;
        const reliability = liveUser?.reliability || 90;
        const battery = liveUser?.telemetry?.battery || 100;
        const workload = liveUser?.activeMissionsCount || 0;
        const net = liveUser?.telemetry?.network || '4G';
        const networkQuality = net === '5G' ? 100 : (net === '4G' ? 80 : 50);

        // Commander Score: Trust(40%) + Reliability(30%) + Network(15%) + Battery(10%) + Workload(5%)
        const score = (trustScore * 0.40) + (reliability * 0.30) + (networkQuality * 0.15) + (battery * 0.10) + ((10 - workload) * 0.05);
        if (score > bestScore) {
          bestScore = score;
          bestUid = responder.uid;
        }
      });

      if (bestUid && respondersMap[bestUid]?.role !== 'commander' && promotedCommanderRef.current !== bestUid) {
        promotedCommanderRef.current = bestUid;
        const updates: any = {};
        updates[`responders.${bestUid}.role`] = 'commander';
        setDoc(doc(db, 'alerts', activeAlertId), updates, { merge: true })
          .then(() => {
            writeAuditLog('Commander Promoted', `Responder ${bestUid} assigned as Incident Commander with score ${bestScore.toFixed(1)}`, currentStage);
          })
          .catch(e => console.error("🛰️ COMMANDER_ASSIGN_ERROR:", e));
      }
    }

    let targetRadius = 2.0;
    let reason = 'NO_CLOSE_RANGE_CIVILIANS_EXPANDING_TO_2KM';

    if (civiliansWithin500m.length > 0) {
      if (alertAge > 20 && !hasAccepted) {
        targetRadius = 2.0;
        reason = 'CLOSE_RANGE_UNITS_TIMEOUT_EXPANDING_TO_2KM';
      } else if (hasAccepted && anyCivilianStagnant) {
        targetRadius = 2.0;
        reason = 'RESPONDER_STAGGNANT_EXPANDING_TO_2KM';
      } else {
        targetRadius = 0.5;
        reason = 'CLOSE_RANGE_CIVILIAN_FOUND_LOCKING_0.5KM';
      }
    }

    // Only update state & Firebase if the radius changes
    if (activeRadius !== targetRadius) {
      setActiveRadius(targetRadius);
      if (activeAlertId) {
        setDoc(doc(db, 'alerts', activeAlertId), {
          dispatchRadius: targetRadius,
          lastEscalatedAt: serverTimestamp(),
          escalationReason: reason
        }, { merge: true }).catch(e => console.error("🛰️ RADIUS_FORCE_SYNC_ERROR:", e));
      }
    }

    // Filter protectors list to show based on resolved targetRadius & PCR exceptions
    const finalInRange = sortedAssets.filter((data: any) => {
      const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police', 'Doctor'].includes(data.protectorVetting?.occupation || data.profession) || data.role === 'pcr_officer';
      if (isElite) {
        return data.distanceKm! <= 5.0;
      }
      return data.distanceKm! <= targetRadius;
    });

    setNearbyCount(finalInRange.length);
    setProtectors(finalInRange);
  }, [isSOSActive, userPos, rawUsers, activeRadius, activeAlertId, activeAlertData, timerPulse, setActiveRadius]);

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
