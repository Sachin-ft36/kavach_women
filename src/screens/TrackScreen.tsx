import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, addDoc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import mapboxgl from 'mapbox-gl';
import {
  Shield, MapPin, Activity, Phone, Car, Clock,
  Navigation, AlertTriangle, CheckCircle2, ChevronRight,
  ShieldAlert, Compass, RefreshCw, ChevronLeft, Share2, Users, ShieldCheck, X, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { KavachSafe } from '../services/KavachNative';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function TrackScreen() {
  const [id, setId] = useState<string | null>(null);
  const [rideData, setRideData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSOSOverlay, setShowSOSOverlay] = useState(false);
  const [triggeringSOS, setTriggeringSOS] = useState(false);
  const [lastSyncDiff, setLastSyncDiff] = useState<number>(0);
  const [sessionExpired, setSessionExpired] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ start?: mapboxgl.Marker; target?: mapboxgl.Marker; live?: mapboxgl.Marker }>({});
  const protectorMarkersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});

  const [nearbyProtectors, setNearbyProtectors] = useState<any[]>([]);
  const [showProtectorsModal, setShowProtectorsModal] = useState(false);
  const [loadingProtectors, setLoadingProtectors] = useState(false);

  // 1. EXTRACT RIDE ID FROM PATHNAME
  useEffect(() => {
    const path = window.location.pathname;
    const extractedId = path.split('/')[2];
    if (extractedId) setId(extractedId);
  }, []);

  // 2. LISTEN TO JOURNEY DOCUMENT IN FIRESTORE
  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, 'journeys', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Enforce 24-hour persistence rule
        if (data.status === 'completed' && data.endedAt) {
          const endedTime = data.endedAt?.toDate?.() || new Date(data.endedAt);
          const diffMs = Date.now() - endedTime.getTime();
          if (diffMs > 24 * 60 * 60 * 1000) {
            setSessionExpired(true);
            setLoading(false);
            return;
          }
        }

        setRideData(data);
      } else {
        setRideData(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Failed to connect to strategic journey log node:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  // 2.5 AUTO-REDIRECT TO DASHBOARD IF SESSION CLOSES/EXPIRES
  useEffect(() => {
    if (!loading && (!rideData || rideData.status === 'completed' || sessionExpired)) {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('pushstate_changed'));
    }
  }, [loading, rideData, sessionExpired]);

  // 2.6 INSTANT REDIRECT — Do not render anything if we know we're redirecting
  const shouldRedirect = !loading && (!rideData || rideData.status === 'completed' || sessionExpired);

  // 3. TRACK TELEMETRY HEARTBEAT TIMER
  useEffect(() => {
    if (!rideData) return;
    const timer = setInterval(() => {
      const lastUpdate = rideData.lastUpdated?.toDate?.() || new Date(rideData.lastUpdated || Date.now());
      setLastSyncDiff(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [rideData]);

  // 4. MAPBOX GL REAL-TIME TRAIL & PIN RENDERER
  useEffect(() => {
    if (loading || !rideData || !mapContainer.current) return;

    const lat = rideData.latitude;
    const lng = rideData.longitude;
    if (lat === undefined || lng === undefined) return;

    // Initialize Mapbox
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [lng, lat],
        zoom: 16.5,
        pitch: 60,
        bearing: 0,
        antialias: true
      });

      map.current.on('style.load', () => {
        // Build glowing 3D structures
        if (map.current) {
          const layers = map.current.getStyle()?.layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
          )?.id;

          map.current.addLayer({
            id: '3d-buildings-strategic',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#0F172A',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.75
            }
          }, labelLayerId);
        }
      });
    }

    const m = map.current;

    // 1. Planned Navigation Route (following roads)
    const plannedCoords = (rideData.plannedRoute || []).map((p: any) => {
      if (Array.isArray(p)) return p;
      if (p && typeof p.lng === 'number' && typeof p.lat === 'number') return [p.lng, p.lat];
      return null;
    }).filter(Boolean);

    // 2. Actual Traveled Path (breadcrumbs)
    const traveledCoords = (rideData.path || []).map((p: any) => {
      if (Array.isArray(p)) return p;
      if (p && typeof p.lng === 'number' && typeof p.lat === 'number') return [p.lng, p.lat];
      return null;
    }).filter(Boolean);

    if (traveledCoords.length === 0) {
      traveledCoords.push([lng, lat]);
    }

    // Draw glowing route history path line
    const drawPathLines = () => {
      if (!m.isStyleLoaded()) return;

      const isEmergency = rideData.status === 'emergency';

      // Draw Planned Route (dashed/semi-transparent line - blue in active, red in emergency)
      if (plannedCoords.length > 0) {
        const plannedGeojson: any = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: plannedCoords
          }
        };

        if (!m.getSource('ride-planned-route')) {
          m.addSource('ride-planned-route', {
            type: 'geojson',
            data: plannedGeojson
          });

          m.addLayer({
            id: 'ride-planned-line',
            type: 'line',
            source: 'ride-planned-route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': isEmergency ? '#EF4444' : '#0EA5E9',
              'line-width': 5,
              'line-opacity': 0.35,
              'line-dasharray': [2, 2]
            }
          });
        } else {
          const src = m.getSource('ride-planned-route') as mapboxgl.GeoJSONSource;
          src.setData(plannedGeojson);
          if (m.getLayer('ride-planned-line')) {
            m.setPaintProperty('ride-planned-line', 'line-color', isEmergency ? '#EF4444' : '#0EA5E9');
          }
        }
      }

    };

    if (m.loaded()) {
      drawPathLines();
    } else {
      m.on('load', drawPathLines);
    }

    const isEmergency = rideData.status === 'emergency';

    // Set Live Pulsing User Avatar
    const avatarBg = isEmergency ? 'rgba(239,68,68,0.25)' : 'rgba(14,165,233,0.2)';
    const avatarBgInner = isEmergency ? 'rgba(239,68,68,0.45)' : 'rgba(14,165,233,0.3)';
    const avatarBorder = isEmergency ? 'border-red-500 bg-red-650' : 'border-white bg-sky-500';
    const avatarShadowColor = isEmergency ? 'rgba(239,68,68,0.9)' : 'rgba(14,165,233,0.8)';
    const avatarHtml = `
      <div class="absolute w-12 h-12 rounded-full animate-ping pointer-events-none" style="animation-duration: 2.5s; background-color: ${avatarBg};"></div>
      <div class="absolute w-8 h-8 rounded-full animate-ping pointer-events-none" style="animation-duration: 1.5s; background-color: ${avatarBgInner};"></div>
      <div class="w-6 h-6 border-2 rounded-full flex items-center justify-center text-white text-[9px] font-black uppercase ${avatarBorder}" style="box-shadow: 0 0 15px ${avatarShadowColor};">
        ${rideData.userName?.charAt(0) || 'K'}
      </div>
    `;

    if (!markersRef.current.live) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.innerHTML = avatarHtml;
      markersRef.current.live = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(m);
    } else {
      const el = markersRef.current.live.getElement();
      el.innerHTML = avatarHtml;
      markersRef.current.live.setLngLat([lng, lat]);
    }

    // Set Start Marker
    if (traveledCoords.length > 0) {
      if (!markersRef.current.start) {
        const el = document.createElement('div');
        el.className = 'w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg';
        markersRef.current.start = new mapboxgl.Marker(el)
          .setLngLat(traveledCoords[0] as [number, number])
          .addTo(m);
      } else {
        const el = markersRef.current.start.getElement();
        el.className = 'w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg';
      }
    }

    // Set Target Locked Destination Marker
    if (rideData.targetCoords && !markersRef.current.target) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.innerHTML = `
        <div class="absolute w-10 h-10 bg-rose-500/10 rounded-full animate-pulse"></div>
        <div class="w-5 h-5 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg shadow-rose-900/40">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><path d="M12 2v20M2 12h20"/></svg>
        </div>
      `;
      markersRef.current.target = new mapboxgl.Marker(el)
        .setLngLat(rideData.targetCoords)
        .addTo(m);
    }

    // Recenter map on live user
    m.flyTo({
      center: [lng, lat],
      duration: 1200,
      zoom: 16.5,
      essential: true
    });

  }, [loading, rideData]);

  // 5. DESTRUCT METRICS
  let distanceToTarget = 0;
  let eta = 0;
  let isDeviating = false;

  if (rideData?.latitude && rideData?.longitude && rideData?.targetCoords) {
    const lat1 = rideData.latitude;
    const lon1 = rideData.longitude;
    const [lon2, lat2] = rideData.targetCoords;

    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    distanceToTarget = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    eta = Math.round(((distanceToTarget * 1.3) / 22) * 60); // assumes 22km/h speed
    if (eta < 1 && distanceToTarget > 0.05) eta = 1;

    // Detect deviation (straight-line distance to path breadcrumbs versus locked destination vectors)
    // For simplicity: if the deviation distance reported by user device > 200m
    isDeviating = (rideData.deviationDistance || 0) > 0.2 || (rideData.warningsIssued || 0) > 0;
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Fetch protectors near the live citizen location
  useEffect(() => {
    if (!rideData?.latitude || !rideData?.longitude) return;

    setLoadingProtectors(true);
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'protector')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        pList.push({ id: doc.id, ...data });
      });

      const lat1 = rideData.latitude;
      const lon1 = rideData.longitude;

      const computed = pList.map((p) => {
        const pLat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.lastLocation?.latitude || p.latitude;
        const pLng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.lastLocation?.longitude || p.longitude;
        let distance = 999;
        if (pLat && pLng) {
          distance = calculateDistance(lat1, lon1, pLat, pLng);
        }
        return {
          ...p,
          distance,
          distanceStr: distance === 999 ? 'Unknown' : distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
        };
      })
      .filter(p => p.distance < 5.0) // 5km scanning range
      .sort((a, b) => a.distance - b.distance);

      setNearbyProtectors(computed);
      setLoadingProtectors(false);
    });

    return () => unsubscribe();
  }, [rideData?.latitude, rideData?.longitude]);

  // Synchronize Mapbox markers for nearby protectors
  useEffect(() => {
    if (!map.current || !nearbyProtectors) return;

    // Clear old protector markers that are no longer present
    const activeIds = new Set(nearbyProtectors.map(p => p.id));
    Object.keys(protectorMarkersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        protectorMarkersRef.current[id].remove();
        delete protectorMarkersRef.current[id];
      }
    });

    // Add/Update markers
    nearbyProtectors.forEach(p => {
      const pLat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.lastLocation?.latitude || p.latitude;
      const pLng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.lastLocation?.longitude || p.longitude;
      if (!pLat || !pLng) return;

      if (!protectorMarkersRef.current[p.id]) {
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center cursor-pointer';
        el.innerHTML = `
          <div class="absolute w-8 h-8 bg-emerald-500/20 rounded-full animate-ping" style="animation-duration: 3s;"></div>
          <div class="w-6 h-6 bg-emerald-600 border border-white rounded-full flex items-center justify-center shadow-lg text-white">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
        `;
        el.onclick = () => {
          toast.info(`Protector: ${p.name || 'Verified Responder'}`, {
            description: `${p.distanceStr} away • Status: ${p.status === 'responding' ? 'On Mission' : 'Active'}`
          });
        };
        const m = new mapboxgl.Marker(el)
          .setLngLat([pLng, pLat])
          .addTo(map.current!);
        protectorMarkersRef.current[p.id] = m;
      } else {
        protectorMarkersRef.current[p.id].setLngLat([pLng, pLat]);
      }
    });
  }, [nearbyProtectors]);

  // 6. EXECUTE REMOTE EMERGENCY OVERRIDE
  const handleTriggerRemoteSOS = async () => {
    setTriggeringSOS(true);
    try {
      KavachSafe.triggerHapticPulse();
      await addDoc(collection(db, 'commands'), {
        targetUid: id,
        command: 'trigger_sos',
        senderUid: 'guardian_command_node',
        status: 'pending',
        timestamp: serverTimestamp()
      });

      toast.success("Tactical Override Dispatched!", {
        description: `SOS remote signal broadcasted to ${rideData.userName}'s device.`,
        className: "bg-red-950 border-red-500 text-white font-black"
      });
      setShowSOSOverlay(false);
    } catch (err: any) {
      console.error("Remote dispatch failure:", err);
      toast.error("Override Dispatch Failed", {
        description: err.message || "Could not bridge gateway command."
      });
    } finally {
      setTriggeringSOS(false);
    }
  };

  // RENDER LOADING SCREEN
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1),transparent_65%)]" />
        <div className="w-16 h-16 border-4 border-sky-500/10 border-t-sky-500 rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(14,165,233,0.2)]" />
        <p className="text-[10px] font-black uppercase tracking-[6px] text-sky-400 animate-pulse italic">Establishing Secure Tactical Link...</p>
      </div>
    );
  }

  // INSTANT REDIRECT — render null while browser navigates to dashboard
  if (shouldRedirect) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col overflow-hidden font-sans text-slate-200 selection:bg-sky-500/20 selection:text-sky-300">

      {/* 🛡️ HIGH-TECH TACTICAL HEADER */}
      <header className="bg-gradient-to-b from-[#0D111E] to-transparent p-6 pt-10 pb-6 border-b border-white/5 relative overflow-hidden shrink-0 z-20">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

        <div className="flex items-center justify-between relative z-10 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new Event('pushstate_changed'));
              }}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500/15 to-sky-500/5 border border-sky-500/30 rounded-2xl flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]">
              <Shield size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                Guardian <span className="text-sky-400">Uplink</span>
              </h1>
              <div className="flex items-center gap-2 mt-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full w-fit backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    rideData.status === 'emergency' ? "bg-red-400" : "bg-emerald-400"
                  )}></span>
                  <span className={cn(
                    "relative inline-flex rounded-full h-1.5 w-1.5",
                    rideData.status === 'emergency' ? "bg-red-500" : "bg-emerald-500"
                  )}></span>
                </span>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-[2px] leading-none",
                  rideData.status === 'emergency' ? "text-red-400" : "text-sky-400/80"
                )}>
                  National Tactical Command Node
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Compass size={12} className="text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest tabular-nums">
                Lat: {rideData.latitude?.toFixed(5)} · Lng: {rideData.longitude?.toFixed(5)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 🗺️ LIVE COMMAND MAP CONTAINER */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 flex flex-col gap-6 overflow-y-auto z-10 custom-scrollbar pb-28">

        {/* Map Column */}
        <div className="w-full flex flex-col gap-4">
          <div className="bg-[#090D1A] rounded-[36px] overflow-hidden border border-white/5 shadow-2xl h-[400px] md:h-[460px] relative">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

            {/* Map Indicators Overlay */}
            <div className="absolute top-3 left-3 z-[10] flex flex-col gap-2 pointer-events-none">
              <div className="px-2.5 py-1.5 bg-[#090D1A]/95 backdrop-blur-md rounded-full border border-white/5 flex items-center gap-1.5 shadow-xl">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  rideData.status === 'emergency' ? 'bg-red-500' : 'bg-emerald-500'
                )} />
                <span className="text-[7.5px] font-black text-white uppercase tracking-wider leading-none">
                  {rideData.status === 'emergency' ? 'Grid Alert: EMERGENCY' : `Monitoring: ${rideData.userName}`}
                </span>
              </div>
            </div>

            {/* Map ETA & Distance Lock Overlay (Top Right) */}
            <div className="absolute top-3 right-3 z-[10] flex gap-2 pointer-events-auto">
              <div className="px-2.5 py-1.5 bg-[#090D1A]/95 backdrop-blur-md rounded-full border border-white/5 flex items-center gap-2 shadow-xl">
                <div className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider">
                  ETA: <span className="text-white italic font-black text-[8.5px] ml-0.5">{rideData.status === 'completed' ? '0' : !distanceToTarget ? '--' : `${eta} MIN`}</span>
                </div>
                <div className="w-[1px] h-2.5 bg-white/10" />
                <div className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider">
                  LOCK: <span className="text-white italic font-black text-[8.5px] ml-0.5">{rideData.status === 'completed' ? '0.0' : !distanceToTarget ? '--' : `${distanceToTarget.toFixed(1)} KM`}</span>
                </div>
              </div>
            </div>

            {/* Map Vehicle & Destination Overlay (Bottom Left) */}
            <div className="absolute bottom-6 left-6 z-[10] flex flex-col gap-2 pointer-events-auto max-w-[280px]">
              <div className="px-4 py-2 bg-[#090D1A]/95 backdrop-blur-md rounded-xl border border-white/5 flex items-center gap-2 shadow-xl w-fit">
                <Car size={13} className="text-sky-500 animate-pulse" />
                <div className="text-[9px] font-black uppercase text-slate-450 tracking-wider">
                  VEHICLE: <span className="text-white font-mono italic font-black text-[10px] ml-1">{rideData.vehicleNo || 'PCR-UNASSIGNED'}</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-[#090D1A]/95 backdrop-blur-md rounded-xl border border-white/5 flex items-center gap-2 shadow-xl w-fit max-w-[240px] xs:max-w-xs">
                <MapPin size={13} className="text-sky-500 shrink-0" />
                <div className="text-[9px] font-black uppercase text-slate-450 tracking-wider truncate min-w-0">
                  DEST: <span className="text-slate-200 font-bold text-[10px] ml-1 truncate" title={rideData.destination}>{rideData.destination || 'Not Configured'}</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 z-[10] pointer-events-auto">
              <button
                onClick={() => {
                  if (map.current && rideData.latitude) {
                    map.current.flyTo({
                      center: [rideData.longitude, rideData.latitude],
                      zoom: 17,
                      pitch: 60,
                      duration: 1200
                    });
                  }
                }}
                className="p-3 bg-[#0D111E]/90 hover:bg-[#1C2030] text-sky-400 rounded-2xl border border-white/10 shadow-2xl transition-all active:scale-95"
              >
                <RefreshCw size={14} className="animate-pulse" />
              </button>
            </div>
          </div>

          {/* Action Elements Panel */}
          <div className="bg-[#090D1A]/80 backdrop-blur-md p-6 rounded-[36px] border border-white/5 shadow-2xl flex flex-col gap-3">
            {rideData.status === 'emergency' ? (
              <>
                <button
                  onClick={() => window.open('tel:112', '_self')}
                  className="w-full h-14 bg-gradient-to-r from-red-650 to-red-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-[3px] flex items-center justify-center gap-2.5 shadow-2xl shadow-red-950/80 hover:scale-[1.02] active:scale-95 transition-all border border-red-500/30"
                >
                  <Phone size={16} fill="white" /> Call Police (112)
                </button>

                <button
                  onClick={() => {
                    const text = `URGENT: Woman in danger. Moving Vehicle No: ${rideData.vehicleNo || 'Unknown'}. Track live here: ${window.location.href}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 border border-emerald-500/20"
                >
                  <Share2 size={12} /> Share to Police WhatsApp
                </button>

                <button
                  onClick={() => setShowProtectorsModal(true)}
                  className="w-full h-12 bg-emerald-650/15 hover:bg-emerald-650/25 text-[#10B981] rounded-2xl text-[9.5px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 transition-all border border-[#10B981]/25"
                >
                  <Users size={12} /> Nearby Responders ({nearbyProtectors.length})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowSOSOverlay(true)}
                  className="w-full h-14 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[3px] flex items-center justify-center gap-2.5 shadow-2xl shadow-red-950/60 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <ShieldAlert size={16} /> Trigger Remote SOS
                </button>

                <button
                  onClick={() => window.open(`tel:${rideData.victimPhone || '100'}`, '_self')}
                  className="w-full h-12 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-[9px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 transition-all"
                >
                  <Phone size={12} /> Contact User Directly
                </button>

                <button
                  onClick={() => setShowProtectorsModal(true)}
                  className="w-full h-12 bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 rounded-2xl text-[9.5px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 transition-all border border-sky-500/20"
                >
                  <Users size={12} /> Nearby Protectors ({nearbyProtectors.length})
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* 🚨 FRICTION LAYER / CRITICAL CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {showSOSOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 font-sans"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#0F1322] border border-rose-500/30 rounded-[32px] p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500/0 via-rose-500 to-rose-500/0"></div>

              <div className="w-16 h-16 bg-rose-500/10 rounded-[24px] border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-6">
                <AlertTriangle size={32} className="animate-bounce" style={{ animationDuration: '3s' }} />
              </div>

              <h3 className="text-white text-xl font-black tracking-widest uppercase mb-3">Critical Command Override</h3>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-8 leading-relaxed">
                Are you sure you want to trigger SOS for <span className="text-rose-400 font-black">{rideData.userName}</span>?
              </p>

              <div className="flex gap-4">
                <button
                  disabled={triggeringSOS}
                  onClick={() => setShowSOSOverlay(false)}
                  className="flex-1 py-4.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[2px] active:scale-95 transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  disabled={triggeringSOS}
                  onClick={handleTriggerRemoteSOS}
                  className="flex-1 py-4.5 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-[2px] shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center"
                >
                  {triggeringSOS ? "Broadcasting..." : "Trigger SOS Now"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛡️ NEARBY PROTECTORS DETAIL SHEET MODAL */}
      <AnimatePresence>
        {showProtectorsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#0D1220] border border-[#1E293B] rounded-[28px] p-6 shadow-2xl relative flex flex-col max-h-[80vh] overflow-hidden"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Users className="text-sky-400" size={18} />
                  <h3 className="text-white text-sm font-black tracking-wider uppercase">Nearby Protectors Scan</h3>
                </div>
                <button
                  onClick={() => setShowProtectorsModal(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
                {nearbyProtectors.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <ShieldAlert size={32} className="text-slate-600 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-wider">No protectors detected in 5km perimeter</p>
                  </div>
                ) : (
                  nearbyProtectors.map((protector) => (
                    <div key={protector.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex gap-3 items-center">
                        <div className="relative w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                          <User size={16} className="text-slate-400" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-bold text-white leading-none">{protector.name || 'Verified Protector'}</span>
                            {protector.isVerified !== false && (
                              <ShieldCheck size={11} className="text-sky-400" fill="currentColor text-white" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {protector.distanceStr} away <span className="text-slate-600 mx-1">•</span> <span className={protector.status === 'responding' ? 'text-amber-500' : 'text-emerald-400'}>{protector.status === 'responding' ? 'On Mission' : 'Active'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => toast.info(`Credentials: ${protector.name || 'Protector'}, profession: ${protector.protectorVetting?.occupation || 'Responder'}.`)} 
                          className="py-1.5 px-3 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-white/10 transition-colors"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => window.open(`tel:${protector.phoneNumber || protector.phone || '100'}`, '_self')} 
                          className="py-1.5 px-3 bg-sky-600/20 text-sky-400 border border-sky-400/20 rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-sky-600/30 transition-colors"
                        >
                          Call
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[2px]">Showing active responders within 5km of victim</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔐 LEDGER METADATA FOOTER */}
      <footer className="bg-[#070913]/90 backdrop-blur-md py-4 px-6 border-t border-white/5 text-center shrink-0 z-20 absolute bottom-0 inset-x-0 flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-red-400">SECURE UPLINK ACTIVE</span>
        </div>
        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[3px] leading-relaxed max-w-xl">
          This telemetry session is monitored under <span className="text-white">KAVACH Sovereign Network Protocols</span>. <br className="xs:hidden" />
          Unauthorized interception or tampering is strictly governed under <span className="text-white">IT Act Section 66</span>.
        </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
      `}</style>
    </div>
  );
}
