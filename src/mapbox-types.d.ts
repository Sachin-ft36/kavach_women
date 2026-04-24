declare module 'react-map-gl' {
  import * as React from 'react';
  export interface MapProps extends Record<string, any> {
    mapboxAccessToken?: string;
    mapStyle?: string;
    style?: React.CSSProperties;
    initialViewState?: any;
    latitude?: number;
    longitude?: number;
    zoom?: number;
    pitch?: number;
    onMove?: (evt: any) => void;
  }
  export const Map: React.FC<MapProps & { ref?: React.RefObject<MapRef> }>;
  export const Marker: React.FC<any>;
  export const Popup: React.FC<any>;
  export const NavigationControl: React.FC<any>;
  export interface MapRef {
    flyTo: (options: { center?: [number, number]; zoom?: number; pitch?: number; bearing?: number; duration?: number }) => void;
    getMap: () => any;
  }
  export default Map;
}
