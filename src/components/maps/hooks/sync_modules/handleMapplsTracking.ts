import { fetchRouteMappls } from '../../../../services/MapplsService';

export function handleMapplsTracking(
  map: any,
  userPos: { lat: number; lng: number },
  routingLat: number,
  routingLng: number,
  isNavigating: boolean,
  Mappls: any,
  directionPluginRef: React.MutableRefObject<any>,
  routePolylineRef: React.MutableRefObject<any>,
  vEloc?: string
) {
  // If not navigating, remove any active route and tracking, then exit
  if (!isNavigating) {
    if (routePolylineRef.current) {
      try {
        if (typeof routePolylineRef.current.remove === 'function') routePolylineRef.current.remove();
        else if (typeof routePolylineRef.current.setMap === 'function') routePolylineRef.current.setMap(null);
        else Mappls.remove({ map: map, layer: routePolylineRef.current });
      } catch (e) {}
      routePolylineRef.current = null;
    }
    if (directionPluginRef.current) {
      try {
        if (typeof directionPluginRef.current.remove === 'function') directionPluginRef.current.remove();
      } catch (e) {}
      directionPluginRef.current = null;
    }
    (window as any)._last_mappls_route_coords = null;
    return;
  }

  let shouldFetch = false;
  const prev = (window as any)._last_mappls_route_coords;
  const lastFetchTime = (window as any)._last_mappls_fetch_time || 0;
  const currentTime = Date.now();

  if (!prev) {
    shouldFetch = true;
  } else {
    const distSq = Math.pow(userPos.lng - prev.uLng, 2) + Math.pow(userPos.lat - prev.uLat, 2);
    const timeElapsed = currentTime - lastFetchTime;
    const navChanged = (window as any)._last_mappls_nav !== isNavigating;
    if (distSq > 0.0000005 || timeElapsed > 30000 || navChanged) {
      shouldFetch = true;
    }
  }

  if (shouldFetch) {
    (window as any)._last_mappls_route_coords = { uLng: userPos.lng, uLat: userPos.lat };
    (window as any)._last_mappls_fetch_time = currentTime;
    (window as any)._last_mappls_nav = isNavigating;

    let targetLat = routingLat;
    let targetLng = routingLng;
    
    const isAtDestination = Math.abs(targetLat - userPos.lat) < 0.00005 && Math.abs(targetLng - userPos.lng) < 0.00005;

    if (isAtDestination) {
      if (routePolylineRef.current) {
        try {
          if (typeof routePolylineRef.current.remove === 'function') routePolylineRef.current.remove();
          else if (typeof routePolylineRef.current.setMap === 'function') routePolylineRef.current.setMap(null);
          else Mappls.remove({ map: map, layer: routePolylineRef.current });
        } catch (e) {}
        routePolylineRef.current = null;
      }
      return; // Reached destination, no route needed
    }

    fetchRouteMappls(userPos.lng, userPos.lat, targetLng, targetLat).then(routePath => {
      if (routePolylineRef.current) {
        try {
          if (typeof routePolylineRef.current.remove === 'function') routePolylineRef.current.remove();
          else if (typeof routePolylineRef.current.setMap === 'function') routePolylineRef.current.setMap(null);
          else Mappls.remove({ map: map, layer: routePolylineRef.current });
        } catch (e) {}
        routePolylineRef.current = null;
      }

      if (routePath && routePath.length > 0) {
        let pCoords = routePath.map((p: any) => ({ lat: p[1] !== undefined ? p[1] : p.lat, lng: p[0] !== undefined ? p[0] : p.lng }));
        routePolylineRef.current = new Mappls.Polyline({
          map: map,
          path: pCoords,
          strokeColor: '#0A84FF',
          strokeWeight: 6,
          strokeOpacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        });
      }
    });

    if (!directionPluginRef.current) {

      Mappls.tracking({
        map: map,
        start: { geoposition: `${userPos.lat},${userPos.lng}` },
        end: { geoposition: `${targetLat},${targetLng}` },
        fitBounds: true,
        ccpIconWidth: 70,
        strokeWidth: 0,
        strokeColor: "transparent",
        routeColor: "transparent",
        start_icon: "https://apis.mapmyindia.com/map_v3/1.png", // Fallback to transparent blank icon if Mappls allows it, or use valid transparent PNG URL
        end_icon: "https://apis.mapmyindia.com/map_v3/1.png",
        sPopup: "", dPopup: "",
        profile: 'driving',
        traffic: true,
        incidents: true,
        alternatives: true,
        avoid: (window as any)._kavach_blocked_road || undefined,
      }, function (data: any) {
        directionPluginRef.current = data;
      });
    } else if (directionPluginRef.current.trackingCall) {
      directionPluginRef.current.trackingCall({
        location: [userPos.lng, userPos.lat],
        reRoute: true,
        heading: true,
        mapCenter: isNavigating,
        buffer: 50,
        delay: 3000,
        fitBounds: false
      });
    }
  }
}
