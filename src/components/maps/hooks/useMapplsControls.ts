import { useState } from 'react';

export function useMapplsControls(mapRef: React.MutableRefObject<any>, userPos: { lat: number; lng: number } | null) {
  const [mapStyle, setMapStyle] = useState<'standard' | 'hybrid'>('standard');

  const toggleMapStyle = () => {
    const Mappls = (window as any).mappls;
    if (mapRef.current && Mappls) {
      const newStyle = mapStyle === 'standard' ? 'hybrid' : 'standard';

      try {
        Mappls.setLayer(newStyle === 'standard' ? 'vector' : 'hybrid');
      } catch (e) {
        if (typeof mapRef.current.setMapType === 'function') {
          mapRef.current.setMapType(newStyle);
        } else if (typeof mapRef.current.setStyle === 'function') {
          mapRef.current.setStyle(newStyle);
        }
      }
      setMapStyle(newStyle);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current && userPos) {
      mapRef.current.setCenter({ lat: userPos.lat, lng: userPos.lng });
      mapRef.current.setZoom(14);
    }
  };

  const handleZoom = (inOut: 'in' | 'out') => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(inOut === 'in' ? currentZoom + 1 : currentZoom - 1);
    }
  };

  return { mapStyle, toggleMapStyle, handleRecenter, handleZoom };
}
