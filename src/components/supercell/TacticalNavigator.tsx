import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Navigation, 
  Search, 
  MapPin, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  AlertTriangle, 
  Shield, 
  Target,
  Navigation2,
  X,
  Layers,
  LocateFixed,
  Compass,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import { cn } from '../../lib/utils';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

// 🛡️ GOOGLE MAPS CONFIGURATION
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with actual key

interface TacticalNavigatorProps {
  userStatusMap: Record<string, any>;
  targetCoords?: { lat: number, lng: number } | null;
  onBack: () => void;
}

export const TacticalNavigator = ({ userStatusMap, targetCoords, onBack }: TacticalNavigatorProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [currentHqPos, setCurrentHqPos] = useState<{ lat: number, lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(google.maps.MapTypeId.ROADMAP);

  const markersRef = useRef<{
    hq?: google.maps.Marker,
    alerts: { [key: string]: google.maps.Marker },
    directionsRenderer?: google.maps.DirectionsRenderer,
    targetMarker?: google.maps.Marker
  }>({ alerts: {} });

  // 🗣️ TACTICAL VOICE ENGINE
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'alerts'), orderBy('timestamp', 'desc')), (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setActiveAlerts(alerts.filter(a => ['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then((google) => {
      if (!mapContainer.current) return;

      map.current = new google.maps.Map(mapContainer.current, {
        center: { lat: 25.448426, lng: 81.331852 },
        zoom: 12,
        tilt: 45,
        mapId: "f07d3b070776985a",
        disableDefaultUI: true,
        styles: [
          { "elementType": "geometry", "stylers": [{ "color": "#0F172A" }] },
          { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1E293B" }] }
        ]
      });

      markersRef.current.directionsRenderer = new google.maps.DirectionsRenderer({
        map: map.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#3B82F6",
          strokeWeight: 6,
          strokeOpacity: 0.9
        }
      });

      // 🚦 ADD TRAFFIC LAYER
      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map.current);

      setIsMapLoaded(true);
    }).catch(e => console.error("🚀 KAVACH: Tactical Navigator Load Failed", e));

    return () => {
      if (markersRef.current.hq) markersRef.current.hq.setMap(null);
      Object.values(markersRef.current.alerts).forEach(m => m.setMap(null));
      if (markersRef.current.targetMarker) markersRef.current.targetMarker.setMap(null);
    };
  }, []);

  // 🎯 AUTOMATED MISSION TARGETING
  useEffect(() => {
    if (isMapLoaded && targetCoords && map.current) {
      const { lat, lng } = targetCoords;
      
      if (markersRef.current.targetMarker) markersRef.current.targetMarker.setMap(null);
      
      markersRef.current.targetMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        }
      });

      map.current.panTo({ lat, lng });
      map.current.setZoom(16);

      const mockAlert = { 
        latitude: lat, 
        longitude: lng, 
        id: 'TACTICAL_TARGET',
        victimName: 'Historical Incident',
        address: 'Tactical Pivot Sector'
      };
      
      setSelectedAlert(mockAlert);

      const checkHqAndStart = setInterval(() => {
        if (currentHqPos) {
          startNavigation(mockAlert);
          clearInterval(checkHqAndStart);
        }
      }, 500);
      
      return () => {
        clearInterval(checkHqAndStart);
        if (markersRef.current.targetMarker) markersRef.current.targetMarker.setMap(null);
      };
    }
  }, [isMapLoaded, targetCoords, currentHqPos === null]);

  // Sync HQ Marker
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude, heading, speed } = pos.coords;
      const coords = { lat: latitude, lng: longitude };
      setCurrentHqPos(coords);

      if (!markersRef.current.hq && map.current) {
        markersRef.current.hq = new google.maps.Marker({
          position: coords,
          map: map.current,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#2563EB",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            rotation: heading || 0
          }
        });
      } else if (markersRef.current.hq) {
        markersRef.current.hq.setPosition(coords);
        const icon = markersRef.current.hq.getIcon() as google.maps.Symbol;
        if (icon) {
          icon.rotation = heading || 0;
          markersRef.current.hq.setIcon(icon);
        }
      }

      if (isNavigating && map.current) {
        map.current.panTo(coords);
      }
    }, (err) => console.error(err), { enableHighAccuracy: true });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating]);

  // Sync SOS Markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    activeAlerts.forEach(alert => {
      const lat = alert.latitude || alert.location?.latitude;
      const lng = alert.longitude || alert.location?.longitude;
      if (!lat || !lng) return;

      if (!markersRef.current.alerts[alert.id]) {
        markersRef.current.alerts[alert.id] = new google.maps.Marker({
          position: { lat, lng },
          map: map.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#EF4444",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }
        });
        markersRef.current.alerts[alert.id].addListener('click', () => {
          setSelectedAlert(alert);
          map.current?.panTo({ lat, lng });
        });
      } else {
        markersRef.current.alerts[alert.id].setPosition({ lat, lng });
      }
    });
  }, [activeAlerts, isMapLoaded]);

  const startNavigation = (alert: any) => {
    if (!currentHqPos || !map.current) return;
    const vLat = alert.latitude || alert.location?.latitude;
    const vLng = alert.longitude || alert.location?.longitude;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin: currentHqPos,
      destination: { lat: vLat, lng: vLng },
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        markersRef.current.directionsRenderer?.setDirections(result);
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          distance: leg.distance?.text,
          duration: leg.duration?.text,
          steps: leg.steps.map(s => ({
            instruction: s.instructions,
            distance: s.distance?.text
          }))
        });
        setIsNavigating(true);
        speak(`Tactical navigation started. Destination is ${leg.duration?.text} away.`);
      }
    });
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setRouteInfo(null);
    markersRef.current.directionsRenderer?.setDirections({ routes: [] } as any);
    window.speechSynthesis.cancel();
  };

  const toggleMapType = () => {
    const newType = mapType === google.maps.MapTypeId.ROADMAP ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP;
    setMapType(newType);
    map.current?.setMapTypeId(newType);
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A] z-[9999] overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      <div className="absolute top-6 left-6 right-6 flex gap-4 z-10 pointer-events-none">
        <div className="flex-1 max-w-md pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/20 flex items-center p-2">
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-gray-500"><X size={20} /></button>
            <input type="text" placeholder="Tactical Search..." className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-900 px-2" />
            <button className="w-10 h-10 flex items-center justify-center text-blue-600"><Navigation size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto flex gap-2 pointer-events-auto scrollbar-hide py-1">
          {activeAlerts.map(alert => (
            <button 
              key={alert.id}
              onClick={() => {
                setSelectedAlert(alert);
                map.current?.panTo({ lat: alert.latitude || alert.location?.latitude, lng: alert.longitude || alert.location?.longitude });
              }}
              className={cn("px-4 py-2 rounded-full border flex items-center gap-2 whitespace-nowrap transition-all shadow-sm backdrop-blur-md", selectedAlert?.id === alert.id ? "bg-rose-600 text-white" : "bg-white/80 text-gray-700")}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">{alert.victimName || 'SOS'}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedAlert && !isNavigating && (
          <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute left-6 top-24 bottom-24 w-[360px] bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl z-50 flex flex-col overflow-hidden border border-white/20">
            <div className="p-8 flex-1">
              <h3 className="text-2xl font-black text-gray-900 mb-2">{selectedAlert.victimName || 'Citizen'}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{selectedAlert.address}</p>
              <button onClick={() => startNavigation(selectedAlert)} className="w-full h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                <Navigation2 size={20} />
                <span className="text-xs font-black uppercase tracking-[2px]">Start Dispatch</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isNavigating && routeInfo && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[40px] p-6 shadow-2xl flex items-center justify-between z-50">
           <div className="text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Duration</p>
              <p className="text-xl font-black text-gray-900">{routeInfo.duration}</p>
           </div>
           <div className="h-10 w-[1px] bg-gray-100" />
           <div className="text-center">
              <p className="text-[8px] font-black text-rose-600 uppercase mb-1">Distance</p>
              <p className="text-xl font-black text-gray-900">{routeInfo.distance}</p>
           </div>
           <button onClick={stopNavigation} className="w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg"><X size={20} /></button>
        </motion.div>
      )}

      <div className="absolute right-6 top-24 space-y-3 z-10">
        <button onClick={toggleMapType} className={cn("w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition-all bg-white", mapType === google.maps.MapTypeId.SATELLITE && "bg-blue-600 text-white")}><Layers size={20} /></button>
        <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center"><LocateFixed size={20} /></button>
      </div>
    </div>
  );
};
