import React from 'react';
import { NeuralHeader } from './neural/NeuralHeader';
import { NeuralPerformanceMetrics } from './neural/NeuralPerformanceMetrics';
import { NeuralRegionalLoad } from './neural/NeuralRegionalLoad';
import { NeuralPredictiveDrift } from './neural/NeuralPredictiveDrift';

interface NeuralAnalyticsProps {
  activeAlerts: any[];
  activeJourneys: any[];
  verifiedProtectors: any[];
  justiceLedger: any[];
  selectedState: string;
  detectedAdminDistrict: string | null;
}

export const NeuralAnalytics: React.FC<NeuralAnalyticsProps> = ({ 
  activeAlerts, 
  activeJourneys, 
  verifiedProtectors,
  justiceLedger,
  selectedState,
  detectedAdminDistrict
}) => {
  const isDistrictTier = !!detectedAdminDistrict;

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-8 bg-[#020617] flex flex-col gap-8">
      <NeuralHeader />

      <NeuralPerformanceMetrics 
        activeAlerts={activeAlerts}
        activeJourneys={activeJourneys}
        justiceLedger={justiceLedger}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <NeuralRegionalLoad
          activeAlerts={activeAlerts}
          activeJourneys={activeJourneys}
          verifiedProtectors={verifiedProtectors}
          justiceLedger={justiceLedger}
          selectedState={selectedState}
          detectedAdminDistrict={detectedAdminDistrict}
        />

        <NeuralPredictiveDrift
          activeJourneys={activeJourneys}
          isDistrictTier={isDistrictTier}
        />
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};
