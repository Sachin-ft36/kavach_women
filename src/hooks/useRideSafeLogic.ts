import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useKavachStore } from '../state/useKavachStore';
import { KavachSafe } from '../services/KavachNative';

export function useRideSafeLogic(isOpen: boolean, isRideActive: boolean, setIsRideActive: (active: boolean) => void, onClose: () => void) {
  const { userPos, rideData, setRideMode, setVoiceTriggerActive, setSOSActive, pendingNavigationTarget, setPendingNavigationTarget, safetyPin } = useKavachStore();
  
  const [destinationQuery, setDestinationQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [holdProgress, setHoldProgress] = useState(0);

  const holdTimerRef = useRef<any>(null);
  const holdIntervalRef = useRef<any>(null);

  // Initialize Mappls SDK
  useEffect(() => {
    if (isOpen) {
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

  // Handle pending navigation target
  useEffect(() => {
    if (isOpen && pendingNavigationTarget) {
      setDestinationQuery(pendingNavigationTarget.name);
      setSelectedDestination({
        name: pendingNavigationTarget.name,
        place_name: pendingNavigationTarget.name,
        center: [pendingNavigationTarget.lng, pendingNavigationTarget.lat],
        eLoc: "CUSTOM_COORDS"
      });
      setPendingNavigationTarget(null);
    }
  }, [isOpen, pendingNavigationTarget]);

  // Mappls AutoSuggest Initialization
  useEffect(() => {
    let checkInterval: any;
    const initMapplsSearch = () => {
      const Mappls = (window as any).mappls;
      const inputEl = document.getElementById("kavach-mappls-auto");

      if (Mappls && Mappls.search && inputEl && !inputEl.classList.contains("mappls-initialized")) {
        inputEl.classList.add("mappls-initialized");
        new Mappls.search(inputEl, {
          region: "IND",
          location: userPos ? [userPos.lat, userPos.lng] : undefined,
          hyperLocal: true,
          clearButton: false,
          tokenizeAddress: true
        }, async (data: any) => {
          if (data) {
            const dt = Array.isArray(data) ? data[0] : data;
            if (!dt) return;

            const title = dt.placeName || dt.poi || "Unknown Place";
            const address = dt.placeAddress || "";
            setDestinationQuery(title);

            const directLat = parseFloat(dt.latitude || dt.lat || dt.y || '');
            const directLng = parseFloat(dt.longitude || dt.lon || dt.lng || dt.x || '');

            if (directLat && directLng && !isNaN(directLat) && !isNaN(directLng)) {
              setSelectedDestination({ name: title, place_name: address, center: [directLng, directLat] as [number, number], eLoc: dt.eLoc });
              return;
            }

            try {
              const addrParts = address.split(',').map((s: string) => s.trim()).filter(Boolean);
              const cityState = addrParts.slice(-3, -1).join(', ');
              const qualifiedQuery = cityState ? `${title}, ${cityState}` : title;
              const proximity = userPos ? `&proximity=${userPos.lng},${userPos.lat}` : '';
              const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

              const mbResp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(qualifiedQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=in${proximity}`);
              const mbData = await mbResp.json();

              if (mbData?.features?.length > 0) {
                const [mbLng, mbLat] = mbData.features[0].center;
                if (mbLat && mbLng && !isNaN(mbLat) && !isNaN(mbLng)) {
                  setSelectedDestination({ name: title, place_name: address, center: [mbLng, mbLat] as [number, number], eLoc: dt.eLoc });
                  return;
                }
              }
            } catch (e) {
              console.warn('Mapbox fallback failed', e);
            }

            toast.error(`Could not find exact location for "${title}". Please search again.`);
            setDestinationQuery("");
          }
        });
        clearInterval(checkInterval);
      }
    };

    if (isOpen) checkInterval = setInterval(initMapplsSearch, 500);
    return () => { if (checkInterval) clearInterval(checkInterval); };
  }, [isOpen, userPos]);

  // Apply styles to Mappls Dropdown
  useEffect(() => {
    const interval = setInterval(() => {
      const inputEl = document.getElementById("kavach-mappls-auto");
      if (inputEl && inputEl.parentElement) {
        inputEl.parentElement.style.setProperty('background', 'transparent', 'important');
        inputEl.parentElement.style.setProperty('border', 'none', 'important');
        inputEl.parentElement.querySelectorAll('.clearButton, .clear-input, .close, .mmi-clear-icon, .clear-btn, [class*="clear"], [class*="close"]').forEach(btn => {
          (btn as HTMLElement).style.setProperty('display', 'none', 'important');
        });
      }
      const mapplsWrap = document.querySelector('.mmi-s-wrap') || document.querySelector('.auto-suggest-dropdown') || document.querySelector('.s-wrap');
      if (mapplsWrap) {
        (mapplsWrap as HTMLElement).style.setProperty('background-color', '#0F172A', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('border', '1px solid rgba(255, 255, 255, 0.1)', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('border-radius', '16px', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('box-shadow', '0 25px 50px -12px rgba(0, 0, 0, 0.8)', 'important');
        (mapplsWrap as HTMLElement).style.setProperty('margin-top', '8px', 'important');
        const ul = mapplsWrap.querySelector('ul');
        if (ul) {
          ul.style.setProperty('background', 'transparent', 'important');
          ul.querySelectorAll('li').forEach(li => {
            (li as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
            (li as HTMLElement).style.setProperty('border-bottom', '1px solid rgba(255, 255, 255, 0.05)', 'important');
            (li as HTMLElement).style.setProperty('padding', '12px 16px', 'important');
            li.querySelectorAll('span').forEach(span => {
              if (span.classList.contains('place-address')) {
                (span as HTMLElement).style.setProperty('color', 'rgba(255, 255, 255, 0.5)', 'important');
                (span as HTMLElement).style.setProperty('font-size', '11px', 'important');
              } else {
                (span as HTMLElement).style.setProperty('color', 'white', 'important');
                (span as HTMLElement).style.setProperty('font-weight', 'bold', 'important');
              }
            });
            li.addEventListener('mouseover', () => (li as HTMLElement).style.setProperty('background-color', 'rgba(255, 255, 255, 0.05)', 'important'));
            li.addEventListener('mouseout', () => (li as HTMLElement).style.setProperty('background-color', 'transparent', 'important'));
          });
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Distance & ETA
  let calculatedDistance = 0;
  let estimatedMinutes = 0;
  if (userPos && rideData?.targetCoords) {
    const [lat1, lon1] = [userPos.lat, userPos.lng];
    const [lon2, lat2] = [rideData.targetCoords[0], rideData.targetCoords[1]];
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    calculatedDistance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    estimatedMinutes = Math.round(((calculatedDistance * 1.3) / 25) * 60);
    if (estimatedMinutes < 1 && calculatedDistance > 0) estimatedMinutes = 1;
  }
  const displayDistance = calculatedDistance > 0 ? calculatedDistance.toFixed(1) : "--";
  const displayMinutes = estimatedMinutes > 0 ? estimatedMinutes : "--";

  // SOS Hold
  const handleSOSPress = () => {
    KavachSafe.triggerHapticPulse();
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += (100 / 30);
      if (progress >= 100) progress = 100;
      setHoldProgress(progress);
    }, 100);
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

  // Pin verify
  useEffect(() => {
    if (showPinModal) try { if (navigator.vibrate) navigator.vibrate([400, 150, 400]); } catch (e) { }
  }, [showPinModal]);

  const verifyPinAndEnd = () => {
    if (safetyPin && pinInput !== safetyPin) { toast.error("Invalid Security PIN."); return; }
    if (!safetyPin && pinInput !== "1234") { toast.error("Invalid Security PIN."); return; }
    setShowPinModal(false);
    setPinInput("");
    setIsRideActive(false);
    setRideMode(false);
    onClose();
    toast.success("Identity Verified. Ride Session Safely Terminated.");
  };

  return {
    destinationQuery, setDestinationQuery,
    selectedDestination, setSelectedDestination,
    useMapboxFallback, setUseMapboxFallback,
    mapStyle, setMapStyle,
    showLayerMenu, setShowLayerMenu,
    showPinModal, setShowPinModal,
    pinInput, setPinInput,
    holdProgress, handleSOSPress, handleSOSRelease,
    displayDistance, displayMinutes,
    verifyPinAndEnd
  };
}
