export function getCircleData(lat: number, lng: number, radiusKm: number) {
  const points = 64;
  const distanceX = radiusKm / (111.320 * Math.cos(lat * Math.PI / 180));
  const distanceY = radiusKm / 110.574;
  const ret = [];
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([lng + x, lat + y]);
  }
  ret.push(ret[0]);
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ret] },
      properties: {}
    }]
  };
}

export function drawMapplsRadiusCircle(map: any, lat: number, lng: number, radiusKm: number = 5) {
  if (!map || !map.getSource) return;

  const sourceId = 'user-radius-source';
  const circleData = getCircleData(lat, lng, radiusKm);

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(circleData);
  } else {
    map.addSource(sourceId, { type: 'geojson', data: circleData });
    map.addLayer({
      id: 'user-radius-fill',
      type: 'fill',
      source: sourceId,
      paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.05 }
    });
    map.addLayer({
      id: 'user-radius-line',
      type: 'line',
      source: sourceId,
      paint: { 'line-color': '#3B82F6', 'line-width': 1, 'line-opacity': 0.3 }
    });
  }
}
