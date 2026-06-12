export function handleMapplsTracking(
  map: any,
  userPos: { lat: number; lng: number },
  routingLat: number,
  routingLng: number,
  isNavigating: boolean,
  Mappls: any,
  directionPluginRef: React.MutableRefObject<any>
) {
  let shouldFetch = false;
  const prev = (window as any)._last_mappls_route_coords;
  const lastFetchTime = (window as any)._last_mappls_fetch_time || 0;
  const currentTime = Date.now();

  if (!prev) {
    shouldFetch = true;
  } else {
    const distSq = Math.pow(userPos.lng - prev.uLng, 2) + Math.pow(userPos.lat - prev.uLat, 2);
    const timeElapsed = currentTime - lastFetchTime;
    if (distSq > 0.0000005 || timeElapsed > 30000) {
      shouldFetch = true;
    }
  }

  if (shouldFetch) {
    (window as any)._last_mappls_route_coords = { uLng: userPos.lng, uLat: userPos.lat };
    (window as any)._last_mappls_fetch_time = currentTime;

    if (directionPluginRef.current) {
      directionPluginRef.current.remove();
    }

    if (!directionPluginRef.current) {
      Mappls.tracking({
        map: map,
        start: { geoposition: `${userPos.lat},${userPos.lng}` },
        end: { geoposition: `${routingLat},${routingLng}` },
        fitBounds: false,
        ccpIconWidth: 70,
        strokeWidth: 6,
        routeColor: "#3B82F6",
        sPopup: "", dPopup: "",
        start_icon: "", end_icon: "",
        profile: 'walking',
        resource: 'route_eta',
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
