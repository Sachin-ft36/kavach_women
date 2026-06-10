import React from 'react';
import { createPortal } from 'react-dom';
import { Shield, Activity, ShieldCheck, MapPin, Lock, Smartphone, Users, ChevronRight, Car, Zap, ShieldAlert, Globe, Navigation, Compass, Camera, AlertTriangle, Search, Volume2, X, Route, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';
import { auth } from '../firebase';
import MapplsVictimMap from './maps/MapplsVictimMap';
import VictimMap from './maps/VictimMap';
import { toast } from 'sonner';
import { KavachSafe } from '../services/KavachNative';
import { Capacitor } from '@capacitor/core';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

interface RideSafeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isRideActive: boolean;
  setIsRideActive: (active: boolean) => void;
  vehicleNo: string;
  setVehicleNo: (no: string) => void;
}

export default function RideSafeOverlay({
  isOpen,
  onClose,
  isRideActive,
  setIsRideActive,
  vehicleNo,
  setVehicleNo
}: RideSafeOverlayProps) {
  const { userPos, batteryLevel, updateRideData, setRideMode, setVoiceTriggerActive, setSOSActive, rideData, pendingNavigationTarget, setPendingNavigationTarget } = useKavachStore();
  const [destinationQuery, setDestinationQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [selectedDestination, setSelectedDestination] = React.useState<any>(null);
  const [verifiedVehicle, setVerifiedVehicle] = React.useState<any>(null);
  const [useMapboxFallback, setUseMapboxFallback] = React.useState(false); // 🛰️ Mappls Native Engine is default!
  const [isSearching, setIsSearching] = React.useState(false);
  const [mapboxSuggestions, setMapboxSuggestions] = React.useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [mapStyle, setMapStyle] = React.useState<'streets' | 'satellite' | 'dark'>('streets');
  const [showLayerMenu, setShowLayerMenu] = React.useState(false);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pinInput, setPinInput] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      // Ensure Mappls Scripts are loaded globally for Search even before Map mounts
      const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "hiexfwnhftspmoasdsnuwukpxugoaljlqhls";

      if (!document.getElementById('mappls-sdk')) {
        const script = document.createElement('script');
        script.id = 'mappls-sdk';
        script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${REST_KEY}`;
        script.async = true;
        document.head.appendChild(script);
      }

      if (!document.getElementById('mappls-plugins')) {
        const pluginsScript = document.createElement('script');
        pluginsScript.id = 'mappls-plugins';
        pluginsScript.src = `https://sdk.mappls.com/map/sdk/plugins?v=3.0&access_token=${REST_KEY}`;
        pluginsScript.async = true;
        document.head.appendChild(pluginsScript);
      }
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (showPinModal) {
      try { if (navigator.vibrate) navigator.vibrate([400, 150, 400]); } catch (e) { }
    }
  }, [showPinModal]);

  React.useEffect(() => {
    if (isOpen && pendingNavigationTarget) {
      setDestinationQuery(pendingNavigationTarget.name);
      setSelectedDestination({
        name: pendingNavigationTarget.name,
        place_name: pendingNavigationTarget.name,
        center: [pendingNavigationTarget.lng, pendingNavigationTarget.lat],
        eLoc: "CUSTOM_COORDS"
      });
      // Clear it so it doesn't fire again unexpectedly
      setPendingNavigationTarget(null);
    }
  }, [isOpen, pendingNavigationTarget]);

  // SOS Hold Logic
  const [holdProgress, setHoldProgress] = React.useState(0);
  const holdTimerRef = React.useRef<any>(null);
  const holdIntervalRef = React.useRef<any>(null);

  const handleSOSPress = () => {
    KavachSafe.triggerHapticPulse();
    let progress = 0;

    // Animate progress bar over 3 seconds
    holdIntervalRef.current = setInterval(() => {
      progress += (100 / 30); // 30 frames for 3 seconds (100ms per frame)
      if (progress >= 100) progress = 100;
      setHoldProgress(progress);
    }, 100);

    // Trigger after 3 seconds
    holdTimerRef.current = setTimeout(() => {
      KavachSafe.triggerHapticPulse();
      setSOSActive(true, null, 'ride');
      onClose();
      handleSOSRelease();
    }, 3000);
  };

  const handleSOSRelease = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };


  // Initialize Mappls AutoSuggest Plugin on the Input Field
  React.useEffect(() => {
    let checkInterval: any;

    const initMapplsSearch = () => {
      const Mappls = (window as any).mappls;
      const inputEl = document.getElementById("kavach-mappls-auto");

      if (Mappls && Mappls.search && inputEl && !inputEl.classList.contains("mappls-initialized")) {
        inputEl.classList.add("mappls-initialized");

        // 🛡️ KAVACH: Mappls-only coordinate resolution — NO Nominatim, NO Mapbox, NO fake offsets
        new Mappls.search(inputEl, {
          region: "IND",
          location: userPos ? [userPos[0], userPos[1]] : undefined,
          hyperLocal: true,
          clearButton: false,
          tokenizeAddress: true
        }, async (data: any) => {
          if (data) {
            const dt = Array.isArray(data) ? data[0] : data;
            if (!dt) return;

            console.log("🔍 KAVACH MAPPLS RESULT:", dt);

            const title = dt.placeName || dt.poi || "Unknown Place";
            const address = dt.placeAddress || "";
            setDestinationQuery(title);

            // ── TIER 1: Direct coords from Mappls autosuggest payload (Drop-off point) ──
            // Mappls V3 Autosuggest provides the exact driving drop-off coordinates (e.g., highway entry gates).
            // We do NOT use OSM or Mapbox text-based fallbacks here because they aggressively match partial address strings (like 'Gothwa') if the exact POI name fails, causing wild offsets.
            const directLat = parseFloat(dt.latitude || dt.lat || dt.y || '');
            const directLng = parseFloat(dt.longitude || dt.lon || dt.lng || dt.x || '');

            if (directLat && directLng && !isNaN(directLat) && !isNaN(directLng)) {
              const dest = { name: title, place_name: address, center: [directLng, directLat] as [number, number], eLoc: dt.eLoc };
              console.log("✅ KAVACH TIER-1 DESTINATION (direct autosuggest):", dest);
              setSelectedDestination(dest);
              return;
            }
            // ── TIER 2: Mapbox geocoding with proximity bias ──
            // If Mappls omits the coordinates (common in V3 for certain eLocs), we fallback to Mapbox.
            try {
              const addrParts = address.split(',').map((s: string) => s.trim()).filter(Boolean);
              const cityState = addrParts.slice(-3, -1).join(', ');
              const qualifiedQuery = cityState ? `${title}, ${cityState}` : title;

              const proximity = userPos ? `&proximity=${userPos[1]},${userPos[0]}` : '';
              const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

              console.log('🔍 KAVACH TIER-2 Mapbox query:', qualifiedQuery);

              const mbResp = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(qualifiedQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=in${proximity}`
              );
              const mbData = await mbResp.json();

              if (mbData?.features?.length > 0) {
                const [mbLng, mbLat] = mbData.features[0].center;
                if (mbLat && mbLng && !isNaN(mbLat) && !isNaN(mbLng)) {
                  const dest = { name: title, place_name: address, center: [mbLng, mbLat] as [number, number], eLoc: dt.eLoc };
                  console.log('✅ KAVACH TIER-2 DESTINATION (Mapbox):', dest);
                  setSelectedDestination(dest);
                  return;
                }
              }
            } catch (e) {
              console.warn('⚠️ KAVACH: Mapbox Tier-2 failed.', e);
            }


            // ── TIER 3: HARD FAIL — no fake offsets, no wrong cities ──
            console.error("❌ KAVACH: Could not resolve coordinates for:", title, dt);
            toast.error(`Could not find exact location for "${title}". Please search again.`);
            setDestinationQuery("");
          }
        });
        clearInterval(checkInterval);
      }
    };

    if (isOpen) {
      checkInterval = setInterval(initMapplsSearch, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, userPos]);

  // Aggressive Styling for Mappls Dropdown
  React.useEffect(() => {
    const interval = setInterval(() => {
      // 1. Force Hide the Cross Button
      const inputEl = document.getElementById("kavach-mappls-auto");
      if (inputEl && inputEl.parentElement) {
        inputEl.parentElement.style.setProperty('background', 'transparent', 'important');
        inputEl.parentElement.style.setProperty('border', 'none', 'important');
        const clearBtns = inputEl.parentElement.querySelectorAll('.clearButton, .clear-input, .close, .mmi-clear-icon, .clear-btn, [class*="clear"], [class*="close"]');
        clearBtns.forEach((btn) => {
          (btn as HTMLElement).style.setProperty('display', 'none', 'important');
        });
      }

      // 2. Force Dark Theme on Dropdown
      const mapplsWrap = document.querySelector('.mmi-s-wrap') || document.querySelector('.auto-suggest-dropdown') || document.querySelector('.s-wrap');
      if (mapplsWrap) {
        // Apply Inline Dark Theme to wrapper
        (mapplsWrap as HTMLElement).style.setProperty('background-color', '#0F172A', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('border', '1px solid rgba(255, 255, 255, 0.1)', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('border-radius', '16px', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('box-shadow', '0 25px 50px -12px rgba(0, 0, 0, 0.8)', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('overflow', 'hidden', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('margin-top', '8px', 'important');

        const ul = mapplsWrap.querySelector('ul');
        if (ul) {
          ul.style.setProperty('background', 'transparent', 'important');

          // Style all Mappls generated li items
          const lis = ul.querySelectorAll('li');
          lis.forEach(li => {
            (li as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
            (li as HTMLElement).style.setProperty('border-bottom', '1px solid rgba(255, 255, 255, 0.05)', 'important');
            (li as HTMLElement).style.setProperty('padding', '12px 16px', 'important');

            const spans = li.querySelectorAll('span');
            spans.forEach(span => {
              if (span.classList.contains('place-address')) {
                (span as HTMLElement).style.setProperty('color', 'rgba(255, 255, 255, 0.5)', 'important');
                (span as HTMLElement).style.setProperty('font-size', '11px', 'important');
              } else {
                (span as HTMLElement).style.setProperty('color', 'white', 'important');
                (span as HTMLElement).style.setProperty('font-weight', 'bold', 'important');
              }
            });

            li.addEventListener('mouseover', () => { (li as HTMLElement).style.setProperty('background-color', 'rgba(255, 255, 255, 0.05)', 'important'); });
            li.addEventListener('mouseout', () => { (li as HTMLElement).style.setProperty('background-color', 'transparent', 'important'); });
          });
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Dynamic Distance and ETA Calculation
  let calculatedDistance = 0;
  let estimatedMinutes = 0;

  if (userPos && rideData?.targetCoords) {
    const lat1 = userPos[0];
    const lon1 = userPos[1];
    const lon2 = rideData.targetCoords[0]; // Mapbox targetCoords is [lng, lat]
    const lat2 = rideData.targetCoords[1];

    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    calculatedDistance = R * c;

    // Assume average speed in city is roughly 25 km/h -> multiplied by 1.3 for routing overhead
    estimatedMinutes = Math.round(((calculatedDistance * 1.3) / 25) * 60);
    if (estimatedMinutes < 1 && calculatedDistance > 0) estimatedMinutes = 1;
  }

  const displayDistance = calculatedDistance > 0 ? calculatedDistance.toFixed(1) : "--";
  const displayMinutes = estimatedMinutes > 0 ? estimatedMinutes : "--";

  if (!isOpen) return null;

  const overlayContent = (
    <div className="fixed inset-0 z-[2000000] bg-[#0A0A0B] flex flex-col overflow-hidden font-sans">
      {/* Tactical Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent_70%)]" />

      <div className="relative z-10 flex flex-col h-full p-4 sm:p-6 pt-6 sm:pt-10">

        {/* Full-Screen Map Background (Rendered underneath UI) */}
        {isRideActive && (
          <div className="absolute -inset-x-4 -top-6 -bottom-4 sm:-inset-x-6 sm:-top-10 sm:-bottom-6 z-0 pointer-events-auto">
            {!useMapboxFallback ? (
              <MapplsVictimMap onFallback={() => setUseMapboxFallback(true)} />
            ) : (
              <VictimMap />
            )}
          </div>
        )}

        {/* Header Section - Only visible during configuration */}
        {!isRideActive && (
          <div className="relative z-10 flex items-center justify-between mb-6 sm:mb-10">
            <button
              onClick={() => {
                onClose();
                setIsRideActive(false);
              }}
              className="p-2 sm:p-3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white shadow-xl hover:bg-white/10 transition-all flex items-center gap-1.5 sm:gap-2 group pointer-events-auto"
            >
              <ChevronRight size={16} className="rotate-180 sm:size-[18px]" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{isRideActive ? 'Stop' : 'Exit'}</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600/10 border border-blue-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[7px] sm:text-[8px] font-black text-blue-500 uppercase tracking-[2px]">Standby Grid</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-8 pb-24 scrollbar-hide pointer-events-none">
          {!isRideActive ? (
            <div className="pointer-events-auto">
              {/* Trust Hero Section */}
              <div className="text-center space-y-3 sm:space-y-4 mb-4 sm:mb-0">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl sm:rounded-[30px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 border border-white/20">
                    <ShieldCheck size={32} className="text-white sm:size-[40px]" />
                  </div>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter">Ride Safe Protocol</h2>
                  <p className="text-[9px] sm:text-[10px] text-blue-500 font-black uppercase tracking-[3px] sm:tracking-[4px]">National Strategic Command Hub</p>
                </div>
              </div>

              {/* Information HUD */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <Lock size={16} className="mx-auto text-gray-500 mb-2" />
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">256-bit AES</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <Smartphone size={16} className="mx-auto text-gray-500 mb-2" />
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Device Lock</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <ShieldCheck size={16} className="mx-auto text-gray-500 mb-2" />
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Police Verified</span>
                </div>
              </div>

              {/* Configuration Grid */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white/[0.03] p-5 sm:p-8 rounded-3xl sm:rounded-[40px] border border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Car size={60} className="text-white sm:size-[80px]" />
                  </div>

                  <div className="relative z-10 space-y-4 sm:space-y-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-[3px] !text-white !opacity-100 flex items-center gap-2">
                        <Activity size={14} className="!text-white" />
                        Journey Configuration
                      </label>
                      <div className="space-y-3">
                        {/* Destination Search */}
                        <div className="relative z-20">
                          <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-blue-400">
                            <MapPin size={16} className="sm:size-[18px]" />
                          </div>
                          <input
                            id="kavach-mappls-auto"
                            value={destinationQuery}
                            onChange={(e) => {
                              setDestinationQuery(e.target.value);
                              // Only reset if user actively clears or changes the text after a selection
                              if (selectedDestination && e.target.value !== selectedDestination.name) {
                                setSelectedDestination(null);
                              }
                            }}
                            placeholder="Search Destination"
                            className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white placeholder:text-white/60 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all shadow-inner"
                          />
                        </div>

                        {/* Vehicle Number Input */}
                        <div className="relative">
                          <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-blue-400">
                            <Car size={16} className="sm:size-[18px]" />
                          </div>
                          <input
                            value={vehicleNo}
                            onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                            placeholder="e.g. MH 01 AB 1234"
                            className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white placeholder:text-white/60 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all shadow-inner uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
                      <button
                        onClick={async () => {
                          const googleMapsLink = userPos ? `https://www.google.com/maps?q=${userPos[0]},${userPos[1]}` : "GPS signal pending...";
                          const kavachHubLink = `https://kavach-women.web.app/track/${auth.currentUser?.uid}`;

                          const msg = `🚨 *KAVACH TACTICAL ALERT*\n\nRide Safe Protocol: *ACTIVE MONITORING*\n\n*Vehicle:* ${vehicleNo || 'Not Specified'}\n\n📍 *CURRENT LOCATION (Snapshot):*\n${googleMapsLink}\n\n📡 *LIVE MOVEMENT TRACKER (Real-time):*\n${kavachHubLink}\n\n_Note: Live tracker updates movement every 3 seconds. System is linked to Police Command Hub._`;

                          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="w-full py-4 sm:py-5 bg-white text-black rounded-xl sm:rounded-[24px] text-[10px] sm:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[3px] text-center hover:bg-gray-100 active:scale-98 transition-all shadow-xl italic"
                      >
                        Emergency Connect (WhatsApp/SMS)
                      </button>

                      <button
                        onClick={() => {
                          if (!selectedDestination) {
                            toast.error("Please search and select a valid destination.");
                            return;
                          }
                          // 🔍 DEBUG: Log final coordinates before route starts
                          console.log("🚀 KAVACH RIDE START — SELECTED DESTINATION:", {
                            name: selectedDestination.name,
                            center: selectedDestination.center,
                            eLoc: selectedDestination.eLoc,
                            interpretation: `lng=${selectedDestination.center[0]}, lat=${selectedDestination.center[1]}`
                          });
                          if (!vehicleNo) {
                            toast.error("Please enter vehicle number for tactical logging.");
                            return;
                          }

                          // Strict Validation for Indian Vehicle Number Plate Format (All Official Series)
                          // 1. Standard: MH 01 AB 1234
                          // 2. BH Series: 25 BH 1234 AB
                          // 3. Diplomatic/UN: 77 CD 14, 17 CC 3456, 1 UN 14
                          // 4. Military: ^10A123456W (Uses ^ for broad arrow)
                          const plateRegex = /^([A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z]{1,3})?[ -]?[0-9]{1,4}|[0-9]{2}[ -]?BH[ -]?[0-9]{4}[ -]?[A-Z]{1,2}|[0-9]{1,3}[ -]?(CD|CC|UN)[ -]?[0-9]{1,4}|[\^↑]?[0-9]{2}[A-Z][0-9]{4,6}[A-Z])$/i;
                          if (!plateRegex.test(vehicleNo.trim())) {
                            toast.error("Invalid Format! Enter valid format (e.g. MH01AB1234 or 25BH1234A)");
                            return;
                          }
                          setIsRideActive(true);
                          setRideMode(true, {
                            vehicleNo,
                            status: 'active',
                            startTime: Date.now(),
                            destination: selectedDestination ? selectedDestination.place_name : 'Tactical Monitoring',
                            destinationEloc: selectedDestination ? selectedDestination.eLoc : null,
                            targetCoords: selectedDestination ? selectedDestination.center : null,
                            deviationDistance: 0,
                            warningsIssued: 0
                          });
                          setVoiceTriggerActive(true);
                          KavachSafe.triggerHapticPulse();
                          toast.success("Ride Safe Protocol Engaged. Monitoring Active.");
                        }}
                        className="w-full py-4 sm:py-5 bg-[#2563EB] text-white rounded-xl sm:rounded-[24px] text-[10px] sm:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[3px] text-center shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group italic"
                      >
                        Initiate Active Journey Mode
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 opacity-40">
                  <Shield size={12} className="text-blue-500" />
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Secured by National Tactical Grid</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Premium Tactical Top Controls */}
              <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-6 z-10 pointer-events-auto">
                <div className="max-w-lg mx-auto bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 sm:p-2.5 rounded-[28px] flex gap-2">
                  <button
                    onPointerDown={handleSOSPress}
                    onPointerUp={handleSOSRelease}
                    onPointerLeave={handleSOSRelease}
                    className="relative overflow-hidden flex-1 py-3 sm:py-4 bg-gradient-to-b from-red-500 to-red-600 text-white rounded-[22px] text-[11px] sm:text-[12px] font-black uppercase tracking-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_10px_20px_rgba(220,38,38,0.3)] hover:brightness-110 active:scale-[0.98] transition-all flex flex-col items-center justify-center select-none"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-red-800 transition-all duration-100 ease-linear z-0"
                      style={{ width: `${holdProgress}%` }}
                    />
                    <div className="relative z-10 flex items-center gap-1.5 drop-shadow-md">
                      <ShieldAlert size={14} className={holdProgress > 0 ? "animate-ping" : ""} />
                      <span>{holdProgress > 0 ? "HOLDING..." : "Trigger SOS"}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="flex-1 py-3 sm:py-4 bg-white/10 hover:bg-white/20 text-white rounded-[22px] text-[11px] sm:text-[12px] font-black uppercase tracking-[2px] active:scale-[0.98] transition-all flex items-center justify-center border border-white/5 backdrop-blur-md shadow-inner"
                  >
                    <div className="flex items-center gap-1.5 drop-shadow-md">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>End Session</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Floating Speedometer (Left) */}
              <div className="absolute top-24 sm:top-28 left-4 z-10 pointer-events-auto">
                <div className="w-[60px] h-[60px] bg-[#2C3338] rounded-full border-[3px] border-[#3A4349] flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
                  <span className="text-white text-xl font-black leading-none mt-1">0</span>
                  <span className="text-gray-400 text-[9px] font-bold">km/h</span>
                </div>
              </div>

              {/* Floating Layers Button (Right - Top) */}
              <div className="absolute top-24 sm:top-28 right-4 z-10 flex flex-col gap-3 pointer-events-auto items-end">
                <div className="relative">
                  <button
                    onClick={() => setShowLayerMenu(!showLayerMenu)}
                    className={cn(
                      "w-14 h-14 bg-white rounded-[20px] flex items-center justify-center shadow-lg active:scale-95 transition-all border",
                      showLayerMenu ? "shadow-[0_0_30px_rgba(37,99,235,0.2)] border-blue-500/30" : "border-gray-100 hover:bg-gray-50"
                    )}
                    title="Toggle Map View"
                  >
                    <Layers size={24} strokeWidth={2.5} className={cn(
                      "transition-colors",
                      showLayerMenu ? "text-blue-600" : "text-[#3A4349]"
                    )} />
                  </button>

                  {/* Layer Selection Menu */}
                  {showLayerMenu && (
                    <div className="absolute top-0 right-16 w-[260px] bg-white rounded-[24px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col gap-1 z-20 animate-in fade-in zoom-in-95 duration-200">

                      <div className="px-3 py-2 pt-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Map Viewport Layers</span>
                      </div>

                      <button
                        onClick={() => { setMapStyle('streets'); setShowLayerMenu(false); }}
                        className={cn(
                          "w-full flex items-center gap-4 px-5 py-3 rounded-[18px] transition-all text-left font-black text-[12px] uppercase tracking-widest",
                          mapStyle === 'streets' ? "bg-gray-900 text-white shadow-md" : "hover:bg-gray-100/80 text-gray-600"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full", mapStyle === 'streets' ? "bg-white" : "bg-gray-400")} />
                        Standard Streets
                      </button>

                      <button
                        onClick={() => { setMapStyle('dark'); setShowLayerMenu(false); }}
                        className={cn(
                          "w-full flex items-center gap-4 px-5 py-3 rounded-[18px] transition-all text-left font-black text-[12px] uppercase tracking-widest",
                          mapStyle === 'dark' ? "bg-gray-900 text-white shadow-md" : "hover:bg-gray-100/80 text-gray-600"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full", mapStyle === 'dark' ? "bg-white" : "bg-gray-400")} />
                        Tactical Dark
                      </button>

                      <button
                        onClick={() => { setMapStyle('satellite'); setShowLayerMenu(false); }}
                        className={cn(
                          "w-full flex items-center gap-4 px-5 py-3 rounded-[18px] transition-all text-left font-black text-[12px] uppercase tracking-widest",
                          mapStyle === 'satellite' ? "bg-gray-900 text-white shadow-md" : "hover:bg-gray-100/80 text-gray-600"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full", mapStyle === 'satellite' ? "bg-white" : "bg-gray-400")} />
                        Satellite Intel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Navigation Button (Right - Bottom) */}
              <div className="absolute bottom-28 sm:bottom-32 right-4 z-10 pointer-events-auto">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('recenter-map'));
                  }}
                  className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 active:scale-95 transition-transform border border-gray-100 group"
                  title="Recenter Map"
                >
                  <Navigation size={24} strokeWidth={2.5} className="text-[#3A4349] group-active:text-blue-500 transition-colors" />
                </button>
              </div>

              {/* Bottom Info Sheet (Mappls Style) */}
              <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-auto">
                <div className="bg-white rounded-[32px] p-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-lg mx-auto border border-gray-100">
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all shadow-sm shrink-0"
                  >
                    <X size={26} strokeWidth={2.5} />
                  </button>

                  <div className="flex flex-col items-center justify-center">
                    <div className="text-red-600 text-[28px] font-black tracking-tight flex items-baseline gap-1.5 leading-none">
                      {displayMinutes} <span className="text-base font-bold">min</span>
                    </div>
                    <div className="text-[#3A4349] text-xs font-bold flex items-center gap-1.5 mt-1">
                      <span>{displayDistance} km</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <button className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-sm shrink-0">
                    <Route size={22} strokeWidth={2.5} className="text-[#3A4349]" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* SECURE SESSION END MODAL */}
          {showPinModal && (
            <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 rounded-t-[40px] animate-in fade-in zoom-in duration-200 pointer-events-auto">
              <div className="w-full max-w-sm bg-[#0F172A] border border-emerald-500/30 rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0"></div>
                <ShieldCheck className="w-14 h-14 text-emerald-400 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                <h3 className="text-white text-lg font-black tracking-widest uppercase mb-2">Authorize Drop-Off</h3>
                <p className="text-gray-400 text-xs font-medium mb-8">Enter your 4-digit Kavach Security PIN to disable tactical monitoring.</p>

                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-4 text-center text-3xl font-black tracking-[16px] text-white focus:outline-none focus:border-emerald-500 transition-colors mb-8 shadow-inner"
                  placeholder="••••"
                  autoFocus
                />

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput("");
                    }}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase tracking-[2px] active:scale-95 transition-all hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const currentPin = useKavachStore.getState().safetyPin;
                      if (currentPin && pinInput !== currentPin) {
                        toast.error("Access Denied: Invalid Security PIN.");
                        return;
                      }
                      if (!currentPin && pinInput !== "1234") { // Fallback if no PIN is set
                        toast.error("Access Denied: Invalid Security PIN.");
                        return;
                      }
                      setShowPinModal(false);
                      setPinInput("");
                      setIsRideActive(false);
                      setRideMode(false);
                      onClose();
                      toast.success("Identity Verified. Ride Session Safely Terminated.");
                    }}
                    className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all hover:bg-emerald-400"
                  >
                    Verify & End
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
