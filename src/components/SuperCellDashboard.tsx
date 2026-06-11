import React from 'react';
import { SuperCellShell } from './supercell/SuperCellShell';

interface SuperCellDashboardProps {
  viewMode?: string;
  onTabChange?: (m: string) => void;
}

const SuperCellDashboard = ({ viewMode = 'COMMAND', onTabChange }: SuperCellDashboardProps) => {
  return (
    <SuperCellShell 
      viewMode={viewMode} 
      onTabChange={onTabChange} 
    />
  );
};

export default SuperCellDashboard;
