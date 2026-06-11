import React, { useState } from 'react';
import MapplsVictimMap from './MapplsVictimMap';
import VictimMap from './VictimMap';
import MapplsCommandMap from './MapplsCommandMap';
import CommandMap from './CommandMap';
import MapplsSecurityRadarMap from './MapplsSecurityRadarMap';
import SecurityRadarMap from './SecurityRadarMap';
import SafeHavenMap from './SafeHavenMap';

export interface KavachMapProps {
  mode: 'victim' | 'radar' | 'command' | 'safehaven';
  useMapboxFallback?: boolean;
  onFallback?: () => void;
  onClose?: () => void;
  customPos?: [number, number];
  
  // Victim Mode Props
  isInterceptMode?: boolean;
  isNavigating?: boolean;
  onToggleNav?: () => void;
  onResolve?: () => void;
  distance?: string;
  isCarHUD?: boolean;
  
  // Command & Radar Mode Props
  activeAlerts?: any[];
  activeProtectors?: any[];
  activeJourneys?: any[];
  onAlertClick?: (id: string) => void;
  selectedAlertId?: string | null;
  selectedProtectorId?: string | null;
  selectedState?: string;
  isSovereignActive?: boolean;
  showHeatmap?: boolean;
  
  // Advanced Command Props
  victimPath?: any[];
  protectorPath?: any[];
  safePath?: any[];
  projectedPath?: any[];
  replayProgress?: number;
  dangerZonesKmlUrl?: string;
  jurisdictionKmlUrl?: string;
  
  // SafeHaven Props
  initialTarget?: {lat: number, lng: number, name: string, dist?: string};
}

export default function KavachMap(props: KavachMapProps) {
  const [internalFallback, setInternalFallback] = useState(false);

  // Use props.useMapboxFallback if provided, otherwise manage it internally
  const shouldUseMapbox = props.useMapboxFallback !== undefined ? props.useMapboxFallback : internalFallback;

  const handleFallback = () => {
    console.warn("⚠️ KAVACH: Primary Mappls Engine Failed or Fallback Triggered.");
    setInternalFallback(true);
    if (props.onFallback) {
      props.onFallback();
    }
  };

  switch (props.mode) {
    case 'victim':
      return shouldUseMapbox 
        ? <VictimMap {...(props as any)} /> 
        : <MapplsVictimMap {...(props as any)} onFallback={handleFallback} />;
        
    case 'command':
      return shouldUseMapbox 
        ? <CommandMap {...(props as any)} /> 
        : <MapplsCommandMap {...(props as any)} onFallback={handleFallback} />;
        
    case 'radar':
      return shouldUseMapbox 
        ? <SecurityRadarMap {...(props as any)} /> 
        : <MapplsSecurityRadarMap {...(props as any)} onFallback={handleFallback} />;
        
    case 'safehaven':
      // SafeHaven map doesn't currently have a Mapbox equivalent built-in
      return <SafeHavenMap {...(props as any)} />;
      
    default:
      return <div className="p-4 text-white">Invalid Map Mode</div>;
  }
}
