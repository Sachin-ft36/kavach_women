import React, { memo } from 'react';
import { useSecurityRadarMap } from './hooks/useSecurityRadarMap';

const SecurityRadarMap = memo(({ protectors = [], activeRadius = 1.0 }: { protectors?: any[], activeRadius?: number }) => {
  const { mapContainer } = useSecurityRadarMap(protectors, activeRadius);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-[#050505]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Status bars removed for tactical clarity and to prevent overlap with SOS controls */}
      <style>{`
        @keyframes responder-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes elite-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
    </div>
  );
});

export default SecurityRadarMap;
