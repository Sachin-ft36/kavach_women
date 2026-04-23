import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Users, Shield, MapPin, Navigation, Volume2, VolumeX, BellRing, X, ShieldCheck, Activity, Satellite } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, where, limit } from 'firebase/firestore';
import { Geolocation } from '@capacitor/geolocation';
import { cn } from '../lib/utils';

// High-Precision Signal Quality Logic
const getSignalQuality = (accuracy: number | null) => {
  if (accuracy === null) return { label: 'SEARCHING...', color: 'text-gray-500', bg: 'bg-gray-500/10' };
  if (accuracy <= 10) return { label: 'GPS PINPOINT', color: 'text-white bg-green-600', bg: 'bg-green-600/20' };
  if (accuracy <= 50) return { label: 'STABLE SIGNAL', color: 'text-white bg-blue-600', bg: 'bg-blue-600/20' };
  return { label: 'COARSE SIGNAL', color: 'text-white bg-orange-600', bg: 'bg-orange-600/20' };
};

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to handle map centering and tactical auto-fit
function ChangeView({ center, zoom, victimCoords }: { center: [number, number], zoom?: number, victimCoords?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (victimCoords && center) {
      const bounds = L.latLngBounds([center, victimCoords]);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, victimCoords, map, zoom]);
  return null;
}

// Custom Routing Component
function Routing({ from, to }: { from: [number, number] | null, to: [number, number] | null }) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !from || !to) {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      return;
    }

    if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
    }

    routingControlRef.current = L.Routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      lineOptions: {
        styles: [{ color: '#0A84FF', weight: 6, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 1
      },
      createMarker: () => null
    } as any).addTo(map);

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, from, to]);

  return null;
}

export default function RakshakMap({ hideHeader = false, centerOverride = null }: { hideHeader?: boolean, centerOverride?: [number, number] | null }) {
  const { t } = useLanguage();
  const [userPos, setUserPos] = useState<[number, number]>(centerOverride || [28.6139, 77.2090]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(centerOverride || [28.6139, 77.2090]);
  const [hasInitialCentered, setHasInitialCentered] = useState(!!centerOverride);
  const [mapZoom, setMapZoom] = useState(17);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [isLosingLock, setIsLosingLock] = useState(!centerOverride);
  const watchIdRef = useRef<string | null>(null);

  useEffect(() => {
    const startTracking = async () => {
      try {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          await Geolocation.requestPermissions();
        }

        if (watchIdRef.current) {
          await Geolocation.clearWatch({ id: watchIdRef.current });
        }

        // Fast bootstrap to avoid 'Delhi' jump
        try {
          const quickFix = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 2000
          });
          if (quickFix && !hasInitialCentered && !centerOverride) {
            const pos: [number, number] = [quickFix.coords.latitude, quickFix.coords.longitude];
            setMapCenter(pos);
            setUserPos(pos);
          }
        } catch (e) {
          console.warn("Bootstrap delay...");
        }

        const watchId = await Geolocation.watchPosition(
          { 
            enableHighAccuracy: true, // PINPOINT MODE
            timeout: 10000, 
            maximumAge: 0 
          },
          (position, err) => {
            if (err || !position) return;

            const { latitude, longitude, accuracy } = position.coords;
            const newPos: [number, number] = [latitude, longitude];
            
            setUserPos(newPos);
            setAccuracy(accuracy);
            setIsTracking(true);
            setIsLosingLock(false);

            if (!hasInitialCentered) {
              setMapCenter(newPos);
              setHasInitialCentered(true);
            }
          }
        );

        watchIdRef.current = watchId;
      } catch (e) {
        console.error("GPS Failure:", e);
      }
    };

    startTracking();
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
    };
  }, [hasInitialCentered, centerOverride]);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), where('status', '==', 'active'), limit(1));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        setActiveSOS({ 
          id: docSnap.id, 
          coords: [data.location?.latitude || data.coords?.[0], data.location?.longitude || data.coords?.[1]],
          ...data 
        });
      } else {
        setActiveSOS(null);
      }
    });
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {!hideHeader && (
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black tracking-tighter italic uppercase underline decoration-accent-blue/30 underline-offset-4">Rakshak Network</h2>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-60">
                 {isTracking ? `LIVE FEED ACTIVE` : 'STABILIZING UPLINK...'}
               </p>
            </div>
          </div>
          <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full", isTracking ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-orange-500 animate-pulse")} />
            <span className={cn("text-[10px] font-black uppercase tracking-[2px]", isTracking ? "text-green-500/80" : "text-orange-500")}>
              {isTracking ? "GPS LOCKED" : "SIGNAL SEARCH"}
            </span>
          </div>
        </div>
      )}

      <div className={cn(
        "flex-1 rounded-3xl overflow-hidden relative border border-white/10",
        hideHeader ? "h-full min-h-[450px]" : "h-[500px]"
      )}>
        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', background: '#000' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          <ChangeView center={mapCenter} zoom={mapZoom} victimCoords={activeSOS?.coords} />
          {activeSOS && activeSOS.coords && <Routing from={userPos} to={activeSOS.coords} />}
          <Circle center={userPos} radius={accuracy || 10} pathOptions={{ fillColor: '#0A84FF', fillOpacity: 0.15, color: '#0A84FF', weight: 1, dashArray: '5, 10' }} />
          <Marker position={userPos}>
            <Popup>
               <div className="p-2 text-black"><p className="font-bold text-[10px] uppercase">Your Pinpoint Live</p></div>
            </Popup>
          </Marker>
          {activeSOS && activeSOS.coords && (
            <>
              <Circle center={activeSOS.coords} radius={20} pathOptions={{ color: '#ff3b30', fillColor: '#ff3b30', fillOpacity: 0.4 }} />
              <Marker position={activeSOS.coords}>
                <Popup><div className="text-red-600 p-2 font-bold uppercase text-[10px]">SOS ACTIVE: HELP NEEDED</div></Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
