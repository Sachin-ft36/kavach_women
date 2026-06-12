import { useEffect, MutableRefObject } from 'react';

export function useMapplsMarkers(
  mapRef: MutableRefObject<any>,
  isLoaded: boolean,
  activeAlerts: any[],
  activeProtectors: any[],
  activeJourneys: any[],
  selectedAlertId: string | null | undefined,
  markersRef: MutableRefObject<{ [key: string]: any }>,
  onAlertClick?: (id: string) => void
) {
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    const activeIds = [
      ...activeAlerts.map(a => a.id),
      ...activeProtectors.map(p => p.id || p.uid),
      ...activeJourneys.map(j => j.id)
    ];

    Object.keys(markersRef.current).forEach(id => {
      const baseId = id.replace('_polygon', '');
      if (!activeIds.includes(baseId)) {
        try {
          if (markersRef.current[id].remove) {
            markersRef.current[id].remove();
          } else if (Mappls && Mappls.remove) {
            Mappls.remove({ map: mapRef.current, layer: markersRef.current[id] });
          }
        } catch (e) { }
        delete markersRef.current[id];
      }
    });

    activeAlerts.forEach(alert => {
      const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
      const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
      if (!lat || !lng) return;

      const isSelected = selectedAlertId === alert.id;
      const html = isSelected ? `<div class="pulse-marker-victim"></div>` : `<div style="
        width: 16px; 
        height: 16px; 
        background: #EF4444; 
        border: 2px solid white; 
        border-radius: 50%; 
        box-shadow: 0 0 10px rgba(239,68,68,0.8);
      "></div>`;

      if (!markersRef.current[alert.id]) {
        const marker = new Mappls.Marker({
          map: mapRef.current,
          position: { lat, lng },
          html: html,
          width: isSelected ? 40 : 16,
          height: isSelected ? 40 : 16,
          offset: isSelected ? [20, 20] : [8, 8]
        });

        if (onAlertClick) {
          marker.addListener('click', () => onAlertClick(alert.id));
        }
        markersRef.current[alert.id] = marker;
      } else {
        markersRef.current[alert.id].setPosition({ lat, lng });
        if (markersRef.current[alert.id].setHtml) {
          markersRef.current[alert.id].setHtml(html);
        }
      }
    });

    activeProtectors.forEach(protector => {
      const id = protector.id || protector.uid;
      const lat = protector.latitude || protector.lat || protector.lastLat || protector.currentLat || protector.lastLocation?.latitude || protector.lastLocation?.lat || protector.location?.latitude || protector.location?.lat;
      const lng = protector.longitude || protector.lng || protector.lastLng || protector.currentLng || protector.long || protector.lastLocation?.longitude || protector.lastLocation?.lng || protector.location?.longitude || protector.location?.lng;

      if (!lat || !lng) return;

      const isResponding = activeAlerts.some(a => a.activeResponders?.some((r: any) => r.uid === id));
      
      let heading = protector.heading || 0;
      if (heading === 0 && protector.course) heading = protector.course;
      if (heading === 0 && protector.lastHeading) heading = protector.lastHeading;

      let html = '';
      if (isResponding) {
        html = `
          <div style="transform: rotate(${heading}deg); width: 32px; height: 32px; transition: transform 0.2s linear;">
            <div style="position:absolute; top:40%; left:50%; transform:translate(-50%,-50%); width:10px; height:4px; border-radius:2px; background: linear-gradient(90deg, #EF4444 50%, #3B82F6 50%); animation: flashingSiren 0.15s infinite linear; box-shadow: 0 0 15px rgba(239,68,68,0.8);"></div>
            <svg viewBox="0 0 100 100" style="width:100%; height:100%; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">
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
      } else {
        html = `<div style="
          width: 14px; 
          height: 14px; 
          background: #3B82F6; 
          border: 2px solid white; 
          border-radius: 50%; 
          box-shadow: 0 0 8px rgba(59,130,246,0.6);
        "></div>`;
      }

      if (!markersRef.current[id]) {
        markersRef.current[id] = new Mappls.Marker({
          map: mapRef.current,
          position: { lat, lng },
          html: html,
          width: isResponding ? 32 : 14,
          height: isResponding ? 32 : 14,
          offset: isResponding ? [16, 16] : [7, 7]
        });
      } else {
        markersRef.current[id].setPosition({ lat, lng });
        if (markersRef.current[id].setHtml) {
          markersRef.current[id].setHtml(html);
        }
      }
    });

    activeJourneys.forEach(journey => {
      const lat = journey.latitude || journey.lat || journey.lastLat || journey.currentLat || journey.location?.latitude || journey.location?.lat;
      const lng = journey.longitude || journey.lng || journey.lastLng || journey.currentLng || journey.long || journey.location?.longitude || journey.location?.lng;
      if (!lat || !lng) return;

      const isSelected = selectedAlertId === journey.id || selectedAlertId === journey.userId;
      const html = isSelected ? `<div class="pulse-marker-transit"></div>` : `<div style="
        width: 16px; 
        height: 16px; 
        background: #0EA5E9; 
        border: 2px solid white; 
        border-radius: 50%; 
        box-shadow: 0 0 10px rgba(14,165,233,0.8);
      "></div>`;

      if (!markersRef.current[journey.id]) {
        const marker = new Mappls.Marker({
          map: mapRef.current,
          position: { lat, lng },
          html: html,
          width: isSelected ? 40 : 16,
          height: isSelected ? 40 : 16,
          offset: isSelected ? [20, 20] : [8, 8]
        });

        if (onAlertClick) {
          marker.addListener('click', () => onAlertClick(journey.id));
        }
        markersRef.current[journey.id] = marker;
      } else {
        markersRef.current[journey.id].setPosition({ lat, lng });
        if (markersRef.current[journey.id].setHtml) {
          markersRef.current[journey.id].setHtml(html);
        }
      }
    });

  }, [activeAlerts, activeProtectors, activeJourneys, selectedAlertId, isLoaded, onAlertClick]);
}
