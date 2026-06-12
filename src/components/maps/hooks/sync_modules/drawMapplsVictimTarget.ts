export function drawMapplsVictimTarget(map: any, routingLat: number, routingLng: number) {
  if (!map || !map.getSource || !map.addSource) return;

  try {
    const offset = 0.00015;
    const polygonData = {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [routingLng - offset, routingLat + offset],
            [routingLng + offset, routingLat + offset],
            [routingLng + offset, routingLat - offset],
            [routingLng - offset, routingLat - offset],
            [routingLng - offset, routingLat + offset]
          ]]
        },
        "properties": {
          "name": "Target Location",
          "stroke": "#EF4444",
          "strokeOpacity": 0.8,
          "strokeWidth": 3,
          "fill": "#EF4444",
          "fillOpacity": 0.3
        }
      }]
    };

    const sourceId = `victim-target-source`;

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(polygonData);
    } else {
      map.addSource(sourceId, { type: 'geojson', data: polygonData });
      map.addLayer({
        id: `victim-target-layer-fill`,
        type: 'fill',
        source: sourceId,
        paint: { 'fill-color': '#EF4444', 'fill-opacity': 0.3 }
      });
      map.addLayer({
        id: `victim-target-layer-line`,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': '#EF4444', 'line-width': 3, 'line-opacity': 0.8 }
      });
    }
  } catch (e) {
    console.error("Smooth GeoJSON Highlight Error:", e);
  }
}
