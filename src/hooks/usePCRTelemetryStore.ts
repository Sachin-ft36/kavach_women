import { create } from 'zustand';

interface TelemetryCluster {
  badgeId: string;
  callSign: string;
  currentVelocity: number;
  compassHeading: string;
  satelliteFix: '3D_LOCK' | 'SEARCHING';
  updateVehiclePosition: (lat: number, lng: number, speed: number, bearing: number) => void;
}

export const usePCRTelemetryStore = create<TelemetryCluster>((set) => ({
  badgeId: "POL-IND-8092",
  callSign: "CAD-DISPATCH-NODE-04",
  currentVelocity: 0,
  compassHeading: "N/E",
  satelliteFix: '3D_LOCK',

  // Network pipeline stream hook for Mappls updates
  updateVehiclePosition: (lat: number, lng: number, speed: number, bearing: number) => {
    // Dynamic compass mathematical conversion logic
    const headings = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round((bearing || 0) / 45) % 8;
    
    set({
      currentVelocity: Math.round(speed || 0),
      compassHeading: headings[index] || "N",
      satelliteFix: '3D_LOCK'
    });
  }
}));
