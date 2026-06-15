import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../../store/useKavachStore';

export function useRideRouteSync(
  map: React.MutableRefObject<mapboxgl.Map | null>,
  markersRef: React.MutableRefObject<any>,
  isMapLoaded: boolean,
  isRideModeActive: boolean,
  activePos: [number, number] | null
) {
  const rideData = useKavachStore(state => state.rideData);

  useEffect(() => {
    const m = map.current;
    if (!m || !isMapLoaded) return;

    if (isRideModeActive && rideData?.path && rideData.path.length > 0) {
      const updateRideRoute = (coordinates: any[]) => {
        if (!m || !m.isStyleLoaded()) return;
        if (!m.getSource('ride-route')) {
          m.addSource('ride-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            }
          });

          m.addLayer({
            id: 'ride-route',
            type: 'line',
            source: 'ride-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10B981',
              'line-width': 6,
              'line-opacity': 0.8
            }
          });
        } else {
          (m.getSource('ride-route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          });
        }
      };

      const geoJsonCoords = rideData.path.map((p: any) => p.lng !== undefined ? [p.lng, p.lat] : p);
      updateRideRoute(geoJsonCoords);

      if (rideData.targetCoords) {
        if (!markersRef.current.destination) {
          const el = document.createElement('div');
          el.className = 'destination-pos-marker';
          el.innerHTML = `<div style="width: 20px; height: 20px; background: #10B981; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);"></div>`;
          markersRef.current.destination = new mapboxgl.Marker(el)
            .setLngLat(rideData.targetCoords)
            .addTo(m);
        } else {
          markersRef.current.destination.setLngLat(rideData.targetCoords);
        }
      }

      if (!(window as any)._ride_route_fitted && rideData.targetCoords && activePos) {
        m.flyTo({ 
          center: [activePos[1], activePos[0]], 
          zoom: 18.5, 
          pitch: 65, 
          essential: true 
        });
        (window as any)._ride_route_fitted = true;
      }
    } else {
      if (markersRef.current.destination) {
        markersRef.current.destination.remove();
        delete markersRef.current.destination;
      }
      if (m.getLayer('ride-route')) m.removeLayer('ride-route');
      if (m.getSource('ride-route')) m.removeSource('ride-route');
      (window as any)._ride_route_fitted = false;
    }
  }, [rideData?.path, isMapLoaded, isRideModeActive, activePos, map, markersRef]);
}
