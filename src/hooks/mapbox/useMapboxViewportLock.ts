import { useEffect, MutableRefObject } from 'react';

const REGIONAL_COORDINATES: Record<string, [number, number]> = {
  'madhya pradesh': [78.6569, 22.9734],
  'uttar pradesh': [80.9462, 26.8467],
  'delhi': [77.2090, 28.6139],
  'maharashtra': [75.7139, 19.7515],
  'rajasthan': [73.8478, 27.0238],
  'gujarat': [71.1924, 22.2587],
  'karnataka': [75.7139, 15.3173],
  'tamil nadu': [78.6569, 11.1271],
  'kerala': [76.0856, 10.8505],
  'andhra pradesh': [79.7400, 15.9129],
  'telangana': [79.0193, 18.1124],
  'west bengal': [87.8550, 22.9868],
  'bihar': [85.3131, 25.0961],
  'punjab': [75.3412, 31.1471],
  'haryana': [76.0856, 29.0588],
  'rewa': [81.2998, 24.5362],
  'bhopal': [77.4126, 23.2599],
  'indore': [75.8577, 22.7196],
  'jabalpur': [79.9864, 23.1686],
  'gwalior': [78.1772, 26.2183],
  'lucknow': [80.9462, 26.8467],
  'noida': [77.3910, 28.5355],
  'ghaziabad': [77.4224, 28.6692],
  'kanpur': [80.3319, 26.4499],
  'patna': [85.1376, 25.5941],
  'mumbai': [72.8777, 19.0760],
  'pune': [73.8567, 18.5204],
  'bangalore': [77.5946, 12.9716],
  'chennai': [80.2707, 13.0827],
  'hyderabad': [78.4867, 17.3850],
  'kolkata': [88.3639, 22.5726],
  'jaipur': [75.7873, 26.9124]
};

export function useMapboxViewportLock(
  mapRef: MutableRefObject<any>,
  isMapLoaded: boolean,
  selectedState: string,
  currentStyle: string
) {
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const district = sessionStorage.getItem('kavach_admin_district');
    const state = selectedState || sessionStorage.getItem('kavach_admin_state');

    const getGeoJSONBounds = (geojson: any): [[number, number], [number, number]] | null => {
      let coords: [number, number][] = [];
      if (geojson.type === 'Polygon') {
        coords = geojson.coordinates[0];
      } else if (geojson.type === 'MultiPolygon') {
        geojson.coordinates.forEach((poly: any) => {
          if (poly && poly[0]) coords = coords.concat(poly[0]);
        });
      } else if (geojson.type === 'LineString') {
        coords = geojson.coordinates;
      }
      if (coords.length === 0) return null;

      let minLng = coords[0][0];
      let maxLng = coords[0][0];
      let minLat = coords[0][1];
      let maxLat = coords[0][1];

      coords.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });

      return [[minLng, minLat], [maxLng, maxLat]];
    };

    const createMaskGeoJSON = (geojson: any) => {
      const worldRing = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90]
      ];
      let rings: any[] = [worldRing];

      if (geojson.type === 'Polygon') {
        rings = rings.concat(geojson.coordinates);
      } else if (geojson.type === 'MultiPolygon') {
        geojson.coordinates.forEach((poly: any) => {
          if (poly) rings = rings.concat(poly);
        });
      }

      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: rings
        }
      };
    };

    const applyViewportLock = (polygonGeoJSON: any) => {
      if (!mapRef.current) return;

      const borderSource = mapRef.current.getSource('district-boundary');
      if (borderSource) {
        borderSource.setData(polygonGeoJSON);
      }

      const maskSource = mapRef.current.getSource('district-mask');
      if (maskSource) {
        const maskGeoJSON = createMaskGeoJSON(polygonGeoJSON);
        maskSource.setData(maskGeoJSON);

        const isDark = currentStyle.includes('dark') || currentStyle.includes('satellite');
        mapRef.current.setPaintProperty('district-mask-fill', 'fill-color', isDark ? '#090D16' : '#F1F5F9');
      }

      const bounds = getGeoJSONBounds(polygonGeoJSON);
      if (bounds) {
        mapRef.current.fitBounds(bounds, { padding: 60, duration: 1500 });

        const padLng = Math.max((bounds[1][0] - bounds[0][0]) * 0.15, 0.05);
        const padLat = Math.max((bounds[1][1] - bounds[0][1]) * 0.15, 0.05);
        const maxBounds: [[number, number], [number, number]] = [
          [bounds[0][0] - padLng, bounds[0][1] - padLat],
          [bounds[1][0] + padLng, bounds[1][1] + padLat]
        ];
        mapRef.current.setMaxBounds(maxBounds);
      }
    };

    if (district) {
      const distKey = district.toLowerCase();
      if (REGIONAL_COORDINATES[distKey]) {
        mapRef.current.jumpTo({ center: REGIONAL_COORDINATES[distKey], zoom: 11.5 });
      }

      const queryStr = distKey === 'rewa' ? 'Rewa District, Madhya Pradesh, India' : `${district} District, ${state || 'India'}`;
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&polygon_geojson=1&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0 && data[0].geojson && mapRef.current) {
            applyViewportLock(data[0].geojson);
          }
        })
        .catch(err => console.error("District boundary polygon geocode fail:", err));
      return;
    }

    if (state && state.toLowerCase() !== 'national' && state.toLowerCase() !== 'all') {
      const stateKey = state.toLowerCase();
      if (REGIONAL_COORDINATES[stateKey]) {
        mapRef.current.jumpTo({ center: REGIONAL_COORDINATES[stateKey], zoom: 6.8 });
      }

      const queryStr = `${state}, India`;
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&polygon_geojson=1&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0 && data[0].geojson && mapRef.current) {
            applyViewportLock(data[0].geojson);
          }
        })
        .catch(err => console.error("State boundary polygon geocode fail:", err));
      return;
    }

    if (mapRef.current.getSource('district-boundary')) {
      mapRef.current.getSource('district-boundary').setData({ type: 'FeatureCollection', features: [] });
    }
    if (mapRef.current.getSource('district-mask')) {
      mapRef.current.getSource('district-mask').setData({ type: 'FeatureCollection', features: [] });
    }
    mapRef.current.setMaxBounds(null);
    mapRef.current.jumpTo({ center: [78.9629, 21.0], zoom: 4.2 });
  }, [isMapLoaded, selectedState, currentStyle]);
}
