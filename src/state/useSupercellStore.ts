import { create } from 'zustand';
import { IncidentStatus, IncidentCluster } from '../types/supercell';
import { calculateProtectorReliabilityScore } from '../utils/supercellLogicUtils';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AuditExportService } from '../services/AuditExportService';

import { updateTelemetryLogic } from './supercell_modules/supercellTelemetry';
import { updateIncidentStatusLogic } from './supercell_modules/supercellStatus';
import { startEscalationEngineLogic } from './supercell_modules/supercellEscalation';
import { initCommandCenterStreamsLogic } from './supercell_modules/supercellStreams';

interface SupercellCommandState {
  activeIncidents: Record<string, IncidentCluster>;
  globalAuditLogs: string[];
  realtimeChannel: RealtimeChannel | null; // Prevent React 18 StrictMode duplicate subscription crashes
  initCommandCenterStreams: () => void;
  addAuditLog: (log: string, type?: string) => void;
  addLogToIncident: (incidentId: string, log: string) => void;
  updateTelemetry: (nodeId: string, lat: number, lng: number, decibel?: number, transcript?: string) => void;
  dispatchOfficialReport: (incidentId: string) => Promise<boolean>;
  escalateIncident: (incidentId: string, level: 'PCR' | 'HQ' | 'STATE', reason?: string) => void;
  startEscalationEngine: (incidentId: string) => void;
  updateIncidentStatus: (incidentId: string, status: IncidentStatus, responderId?: string) => Promise<void>;
  calculateReliabilityScore: (protectorId: string) => { score: number, rank: 'Gold' | 'Silver' | 'Bronze' | 'Unranked' };
}

export const useSupercellStore = create<SupercellCommandState>((set, get) => ({
  activeIncidents: {},
  globalAuditLogs: [
    `[${new Date().toLocaleTimeString()}] 📡 SUPERCELL CORE: Command Center Listener online.`
  ],
  realtimeChannel: null,

  addAuditLog: (log: string, type?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    set(state => ({
      globalAuditLogs: [`[${timestamp}] ${log}`, ...state.globalAuditLogs].slice(0, 100)
    }));
  },

  addLogToIncident: (incidentId: string, log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const current = { ...get().activeIncidents };
    
    // Find incident with matching incidentId
    const nodeId = Object.keys(current).find(key => current[key].incidentId === incidentId);
    if (nodeId && current[nodeId]) {
      const logs = current[nodeId].systemLogs || [];
      current[nodeId].systemLogs = [`[${timestamp}] ${log}`, ...logs].slice(0, 10);
      set({ activeIncidents: current });
    }
  },

  updateTelemetry: async (nodeId: string, lat: number, lng: number, decibel: number = 45, transcript: string = "Listening...") => {
    const updatedIncidents = await updateTelemetryLogic(get().activeIncidents, nodeId, lat, lng, decibel, transcript);
    if (updatedIncidents) {
      set({ activeIncidents: updatedIncidents });
    }
  },

  dispatchOfficialReport: async (incidentId: string): Promise<boolean> => {
    const current = { ...get().activeIncidents };
    const nodeId = Object.keys(current).find(key => current[key].incidentId === incidentId);
    if (!nodeId || !current[nodeId]) return false;

    const incident = current[nodeId];
    
    get().addAuditLog(`🚨 BROADCAST: Compressed legal dispatch packet sent to 5km radius protectors for Case: ${incident.incidentId}`);
    get().addLogToIncident(incidentId, `🚨 OFFICIAL DISPATCH: Dispatch payload sent successfully.`);

    // Realtime broadcast simulation to police console servers
    console.log("🏛️ GOVERNMENT DISPATCH PIPELINE ENGAGED:", incident);
    
    // Generate PDF Audit Trail
    try {
      await (AuditExportService as any).generatePDF(incident as any);
      toast.success("Official PDF Audit Report Generated!");
    } catch (error) {
      console.error("PDF Export Failed", error);
      toast.error("Failed to generate PDF Report.");
    }

    return true;
  },

  updateIncidentStatus: async (incidentId: string, newStatus: IncidentStatus, responderId?: string) => {
    const updatedIncidents = await updateIncidentStatusLogic(
      get().activeIncidents,
      incidentId,
      newStatus,
      responderId,
      get().addAuditLog,
      get().addLogToIncident
    );
    if (updatedIncidents) {
      set({ activeIncidents: updatedIncidents });
    }
  },

  calculateReliabilityScore: (protectorId: string) => {
    return calculateProtectorReliabilityScore(protectorId);
  },

  escalateIncident: (incidentId: string, level: 'PCR' | 'HQ' | 'STATE', reason: string = 'SLA Breach') => {
    get().addAuditLog(`⚠️ AUDIT [Escalation]: Incident ${incidentId} escalated to ${level} due to ${reason}.`, 'Escalation');
    get().addLogToIncident(incidentId, `⚠️ AUTOMATED ESCALATION to ${level} level. (${reason})`);
    console.warn(`🚨 ESCALATING ${incidentId} to ${level} - ${reason}`);
  },

  startEscalationEngine: (incidentId: string) => {
    startEscalationEngineLogic(
      incidentId, 
      () => get().activeIncidents, 
      get().addAuditLog, 
      get().escalateIncident
    );
  },

  initCommandCenterStreams: () => {
    initCommandCenterStreamsLogic(
      get().realtimeChannel,
      get().addAuditLog,
      () => get().activeIncidents,
      (incidents) => set({ activeIncidents: incidents }),
      get().startEscalationEngine,
      (channel) => set({ realtimeChannel: channel })
    );
  }
}));
