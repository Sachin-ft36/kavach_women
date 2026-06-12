import { useState, useEffect, MutableRefObject, useRef } from 'react';
import { fetchRouteMappls, fetchRouteDetails } from '../../services/MapplsService';

export function useMapplsTacticalRoute(
  mapRef: MutableRefObject<any>,
  isLoaded: boolean,
  activeAlerts: any[],
  activeProtectors: any[],
  activeJourneys: any[],
  selectedAlertId: string | null | undefined,
  userPos: any,
  commandCenterMarkerRef: MutableRefObject<any>,
  headingRef: MutableRefObject<number>,
  lastUserPosRef: MutableRefObject<number[]>
) {
  const [routeInfo, setRouteInfo] = useState<{ distance: number, duration: number, fetchTime?: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const navRouteLineRef = useRef<any>(null);
  const prevSelectedAlertIdRef = useRef<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    if (selectedAlertId && selectedAlertId !== prevSelectedAlertIdRef.current) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      const journey = activeJourneys.find(j => j.id === selectedAlertId || j.userId === selectedAlertId);

      if (alert) {
        const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
        const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;

        if (lat && lng) {
          try {
            const executeTacticalNavigation = async (commandCenterLat: number, commandCenterLng: number) => {
              if (typeof mapRef.current.flyTo === 'function') {
                try {
                  if (!Mappls) return;

                  let currentHeading = headingRef.current;
                  if (lastUserPosRef.current[0] !== 0 && userPos && (lastUserPosRef.current[0] !== userPos.lat || lastUserPosRef.current[1] !== userPos.lng)) {
                    const lat1 = lastUserPosRef.current[0];
                    const lng1 = lastUserPosRef.current[1];
                    const lat2 = userPos.lat;
                    const lng2 = userPos.lng;
                    const dy = lat2 - lat1;
                    const dx = Math.cos(Math.PI / 180 * lat1) * (lng2 - lng1);
                    const angle = Math.atan2(dy, dx);
                    currentHeading = (90 - angle * 180 / Math.PI + 360) % 360;
                    headingRef.current = currentHeading;
                  }
                  if (userPos) lastUserPosRef.current = [userPos.lat, userPos.lng];

                  const policeCarHtml = `
                    <div id="command-center-car" class="police-car-container" style="transform: rotate(${currentHeading}deg);">
                      <div class="police-beacon"></div>
                      <svg viewBox="0 0 100 100" class="police-car-svg">
                        <rect x="30" y="10" width="40" height="80" rx="15" fill="#1E3A8A" stroke="#FFFFFF" stroke-width="3"/>
                        <rect x="35" y="30" width="30" height="35" rx="5" fill="#0284C7"/>
                        <rect x="26" y="20" width="4" height="15" rx="2" fill="#000000"/>
                        <rect x="70" y="20" width="4" height="15" rx="2" fill="#000000"/>
                        <rect x="26" y="65" width="4" height="15" rx="2" fill="#000000"/>
                        <rect x="70" y="65" width="4" height="15" rx="2" fill="#000000"/>
                        <path d="M 35 15 L 65 15" stroke="#FBBF24" stroke-width="4"/>
                      </svg>
                    </div>
                  `;

                  if (!commandCenterMarkerRef.current) {
                    commandCenterMarkerRef.current = new Mappls.Marker({
                      map: mapRef.current,
                      position: { lat: commandCenterLat, lng: commandCenterLng },
                      html: policeCarHtml,
                      width: 46,
                      height: 46,
                      offset: [23, 23]
                    });
                  } else {
                    commandCenterMarkerRef.current.setPosition({ lat: commandCenterLat, lng: commandCenterLng });
                    const carEl = document.getElementById('command-center-car');
                    if (carEl) carEl.style.transform = `rotate(${currentHeading}deg)`;
                  }

                  if (navRouteLineRef.current) {
                    try {
                      if (typeof navRouteLineRef.current.remove === 'function') navRouteLineRef.current.remove();
                      else if ((window as any).mappls?.remove) (window as any).mappls.remove({ map: mapRef.current, layer: navRouteLineRef.current });
                    } catch (e) { }
                    navRouteLineRef.current = null;
                  }

                  try {
                    fetchRouteDetails(commandCenterLng, commandCenterLat, lng, lat)
                      .then((details) => {
                        if (details) {
                          setRouteInfo({ ...details, fetchTime: Date.now() });
                        }
                      })
                      .catch(() => { });
                  } catch (e) { }

                  if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
                    mapRef.current.flyTo({ center: [lng, lat], zoom: 19, duration: 1500, pitch: 45 });
                  }

                  setTimeout(() => {
                    try {
                      fetchRouteMappls(commandCenterLng, commandCenterLat, lng, lat)
                        .then((coords) => {
                          if (coords && coords.length > 0) {
                            if (mapRef.current.getSource) {
                              const geojsonData = {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                  type: 'LineString',
                                  coordinates: coords
                                }
                              };

                              if (mapRef.current.getSource('tactical-route-source')) {
                                mapRef.current.getSource('tactical-route-source').setData(geojsonData);
                              } else {
                                mapRef.current.addSource('tactical-route-source', { type: 'geojson', data: geojsonData });
                                mapRef.current.addLayer({
                                  id: 'tactical-route-line',
                                  type: 'line',
                                  source: 'tactical-route-source',
                                  layout: {
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                  },
                                  paint: {
                                    'line-color': '#0EA5E9',
                                    'line-width': 6,
                                    'line-opacity': 0.9
                                  }
                                });
                              }
                            }
                          }

                          if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
                            mapRef.current.flyTo({
                              center: [commandCenterLng, commandCenterLat],
                              zoom: 16,
                              duration: 2500,
                              pitch: 60,
                              bearing: headingRef.current || 0
                            });
                          }
                        })
                        .catch(() => { });
                    } catch (e) { }
                  }, 3000);

                } catch (err) {
                  console.warn("Command Center Routing Failure:", err);
                }
              } else if (typeof mapRef.current.setCenter === 'function') {
                mapRef.current.setCenter({ lat, lng });
                if (typeof mapRef.current.setZoom === 'function') mapRef.current.setZoom(16);
              }
            };

            let startLat: number | null = null;
            let startLng: number | null = null;

            if (alert.activeResponders && alert.activeResponders.length > 0) {
              startLat = alert.activeResponders[0].lastLocation?.lat || alert.activeResponders[0].lat || alert.activeResponders[0].latitude;
              startLng = alert.activeResponders[0].lastLocation?.lng || alert.activeResponders[0].lng || alert.activeResponders[0].longitude;
            }

            if (!startLat || !startLng) {
              if (activeProtectors && activeProtectors.length > 0) {
                startLat = activeProtectors[0].lastLocation?.lat || activeProtectors[0].lat || activeProtectors[0].latitude;
                startLng = activeProtectors[0].lastLocation?.lng || activeProtectors[0].lng || activeProtectors[0].longitude;
              }
            }

            if (startLat && startLng) {
              executeTacticalNavigation(startLat, startLng);
            } else {
              const handleGeolocationFallback = async () => {
                try {
                  const res = await fetch('https://ipapi.co/json/');
                  const data = await res.json();
                  if (data && data.latitude && data.longitude) {
                    executeTacticalNavigation(data.latitude, data.longitude);
                    return;
                  }
                } catch (err) { }
                executeTacticalNavigation(28.6139, 77.2090);
              };

              const isDefaultPos = userPos && Math.abs(userPos.lat - 20.5937) < 0.001 && Math.abs(userPos.lng - 78.9629) < 0.001;
              if (userPos && userPos.lat !== undefined && !isDefaultPos) {
                executeTacticalNavigation(userPos.lat, userPos.lng);
              } else if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => executeTacticalNavigation(pos.coords.latitude, pos.coords.longitude),
                  handleGeolocationFallback,
                  { enableHighAccuracy: true, timeout: 5000 }
                );
              } else {
                handleGeolocationFallback();
              }
            }
          } catch (e) {
            console.warn("Failed to execute tactical navigation", e);
          }
        }
      } else if (journey) {
        const lat = journey.latitude || journey.lat || journey.lastLat || journey.currentLat || journey.location?.latitude || journey.location?.lat;
        const lng = journey.longitude || journey.lng || journey.lastLng || journey.currentLng || journey.long || journey.location?.longitude || journey.location?.lng;

        if (lat && lng && typeof mapRef.current.flyTo === 'function') {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 2000 });
        }

        const destLat = journey.targetCoords?.[1] || journey.destLat || journey.destinationLatitude;
        const destLng = journey.targetCoords?.[0] || journey.destLng || journey.destinationLongitude;

        if (lat && lng && destLat && destLng) {
          fetchRouteMappls(lng, lat, destLng, destLat)
            .then((coords) => {
              if (coords && coords.length > 0 && mapRef.current) {
                const geojsonData = {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: coords
                  }
                };

                if (mapRef.current.getSource('tactical-route-source')) {
                  mapRef.current.getSource('tactical-route-source').setData(geojsonData);
                } else {
                  mapRef.current.addSource('tactical-route-source', { type: 'geojson', data: geojsonData });
                  mapRef.current.addLayer({
                    id: 'tactical-route-line',
                    type: 'line',
                    source: 'tactical-route-source',
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round'
                    },
                    paint: {
                      'line-color': '#0EA5E9',
                      'line-width': 6,
                      'line-opacity': 0.9
                    }
                  });
                }
              }
            })
            .catch((err) => {
              console.warn("Failed to fetch journey route:", err);
            });
        }
      }
    } else if (!selectedAlertId) {
      if (isLoaded && mapRef.current && mapRef.current.getSource && mapRef.current.getSource('tactical-route-source')) {
        try {
          mapRef.current.getSource('tactical-route-source').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
        } catch (e) {}
      }
    }

    prevSelectedAlertIdRef.current = selectedAlertId || null;
  }, [selectedAlertId, activeAlerts, activeJourneys, isLoaded, userPos]);

  return { routeInfo, now };
}
