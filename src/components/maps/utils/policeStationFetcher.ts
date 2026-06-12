import mapboxgl from 'mapbox-gl';

export const fetchAndMapPoliceStations = async (
  map: mapboxgl.Map,
  userPos: { lat: number, lng: number },
  activeRadius: number,
  markersRef: React.MutableRefObject<{ police: mapboxgl.Marker[] }>
) => {
  console.log("🚔 RADAR: Scanning for real Police Stations...");

  try {
    const searchRadius = activeRadius * 1000;
    const query = `
      [out:json];
      (
        node["amenity"="police"](around:${searchRadius},${userPos.lat},${userPos.lng});
        way["amenity"="police"](around:${searchRadius},${userPos.lat},${userPos.lng});
        relation["amenity"="police"](around:${searchRadius},${userPos.lat},${userPos.lng});
      );
      out center;
    `;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await res.json();

    markersRef.current.police.forEach(marker => marker.remove());
    markersRef.current.police = [];

    data.elements.forEach((station: any) => {
      const lat = station.lat || station.center?.lat;
      const lon = station.lon || station.center?.lon;
      if (lat && lon && map) {
        const el = document.createElement('div');
        el.className = 'police-marker';
        el.style.cursor = 'pointer';
        el.style.zIndex = '800'; 
        el.innerHTML = `
          <div style="background: #1e3a8a; padding: 6px; border-radius: 10px; border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(59,130,246,0.5);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
        `;
        
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'police-popup' })
          .setHTML(`
            <div style="padding: 4px; font-family: sans-serif;">
              <h3 style="color: black; font-weight: 900; margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${station.tags?.name || 'Police Station'}</h3>
              <p style="color: #666; font-size: 9px; margin: 2px 0 0 0; font-weight: bold; text-transform: uppercase;">Verified Station</p>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lon, lat])
          .setPopup(popup)
          .addTo(map);
        
        markersRef.current.police.push(marker);
      }
    });
    console.log(`🚔 RADAR: Mapped ${data.elements.length} Police Stations.`);
  } catch (e) {
    console.error("Failed to fetch police stations", e);
  }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};
