import { fetchRouteMappls } from '../../../../services/MapplsService';

export function handleMapplsHybridRide(
  map: any,
  userPos: { lat: number; lng: number },
  isRideModeActive: boolean,
  rideData: any,
  ridePolylineRef: React.MutableRefObject<any>,
  isNavigating: boolean,
  Mappls: any
) {
  if (isRideModeActive && rideData?.targetCoords && userPos && Mappls?.direction) {
    if (!ridePolylineRef.current) {
      console.log("🛰️ KAVACH: Initializing Hybrid Routing (Mapbox Path + Mappls Bike)");
      
      Mappls.tracking({
        map: map,
        start: { geoposition: `${userPos.lat},${userPos.lng}` },
        end: { geoposition: `${rideData.targetCoords[1]},${rideData.targetCoords[0]}` },
        fitBounds: false,
        ccpIconWidth: 70,
        strokeWidth: 0,
        routeColor: "transparent",
        sPopup: "", dPopup: "",
        start_icon: "", end_icon: "",
        profile: 'driving',
        resource: 'route_eta',
        traffic: false,
      }, function (data: any) {
        ridePolylineRef.current = data;
      });

      fetchRouteMappls(userPos.lng, userPos.lat, rideData.targetCoords[0], rideData.targetCoords[1])
        .then(coords => {
          if (coords && coords.length > 0 && map) {
            const routeGeoJSON = {
              type: 'LineString',
              coordinates: coords
            };
            const sourceId = 'hybrid-route-source';
            const layerId = 'hybrid-route-layer';

            if (map.getSource(sourceId)) {
              map.getSource(sourceId).setData(routeGeoJSON);
            } else {
              map.addSource(sourceId, { type: 'geojson', data: routeGeoJSON });
              
              map.addLayer({
                id: layerId + '-outline', type: 'line', source: sourceId,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#1E40AF', 'line-width': 8, 'line-opacity': 0.6 }
              });
              
              map.addLayer({
                id: layerId, type: 'line', source: sourceId,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#3B82F6', 'line-width': 5, 'line-opacity': 1 }
              });
            }

            if (!(window as any)._kavachTargetMarker) {
              (window as any)._kavachTargetMarker = new Mappls.Marker({
                map: map,
                position: { lat: rideData.targetCoords[1], lng: rideData.targetCoords[0] },
                html: `<div style="width:20px;height:20px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>`,
                width: 20, height: 20, offset: [10, 10]
              });
            }
          }
        })
        .catch(err => console.warn("🚨 Hybrid Mappls Route failed:", err));
    } else if (ridePolylineRef.current.trackingCall) {
      ridePolylineRef.current.trackingCall({
        location: [userPos.lng, userPos.lat],
        reRoute: true,
        heading: true,
        mapCenter: isNavigating,
        buffer: 50,
        delay: 3000,
        fitBounds: false
      });
    }
  } else {
    if (ridePolylineRef.current) {
      if (ridePolylineRef.current.remove) ridePolylineRef.current.remove();
      ridePolylineRef.current = null;
    }
    if (map) {
      try {
        if (map.getLayer('hybrid-route-layer')) map.removeLayer('hybrid-route-layer');
        if (map.getLayer('hybrid-route-layer-outline')) map.removeLayer('hybrid-route-layer-outline');
        if (map.getSource('hybrid-route-source')) map.removeSource('hybrid-route-source');
      } catch(e) {}
    }
    if ((window as any)._kavachTargetMarker) {
      (window as any)._kavachTargetMarker.remove();
      (window as any)._kavachTargetMarker = null;
    }
  }
}
