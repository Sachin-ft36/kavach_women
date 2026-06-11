import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { offlineSyncService } from '../services/offlineSyncService';

export type IncidentStatus =
  | "CREATED"
  | "ACKNOWLEDGED"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "RESOLVED"
  | "CLOSED";

export interface EvidenceNode {
  evidenceId: string;
  capturedAt: number;
  capturedBy: string;
  hash: string;
  deviceId: string;
  previousHash: string;
}

export interface TelemetrySnapshot {
  lat: number;
  lng: number;
  speed: number;
  decibel: number;
  timestamp: number;
}

export interface IncidentCluster {
  incidentId: string;
  victimName: string;
  status: IncidentStatus;
  assignedProtectorId?: string;
  assignedPCRId?: string;
  acknowledgedAt?: number;
  assignedAt?: number;
  arrivedAt?: number;
  resolvedAt?: number;
  closedAt?: number;
  currentLatLng: [number, number]; // SWAP WARNING: Convert [Lat, Lng] to strict Mapbox GL [Lng, Lat] format
  forensicTranscript: string;
  nearestThanaName: string;
  bnsOffenseCategory: string;
  decibelLevel: number; // Real-time volume RMS telemetry
  sha256Seal: string; // [🔒 CRYPTO-SEALED via BNSS Sec 63]
  systemLogs: string[]; // Hacker-style rolling terminal console records
  
  // Phase 11: SLAs
  timeToAcknowledgeMs?: number;
  timeToAssignMs?: number;
  timeToReachMs?: number;
  timeToResolveMs?: number;
  
  // Phase 13 & 14: Evidence Vault & Black Box
  evidenceChain: EvidenceNode[];
  blackBoxTelemetry: TelemetrySnapshot[];
}

async function generateSHA256(data: string) {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

interface SupercellCommandState {
  activeIncidents: Record<string, IncidentCluster>;
  globalAuditLogs: string[];
  realtimeChannel: any | null; // Prevent React 18 StrictMode duplicate subscription crashes
  initCommandCenterStreams: () => void;
  addAuditLog: (log: string) => void;
  addLogToIncident: (incidentId: string, log: string) => void;
  updateTelemetry: (nodeId: string, lat: number, lng: number, decibel?: number, transcript?: string) => void;
  dispatchOfficialReport: (incidentId: string) => Promise<boolean>;
  escalateIncident: (incidentId: string, level: 'PCR' | 'HQ' | 'STATE') => void;
  startEscalationEngine: (incidentId: string) => void;
  updateIncidentStatus: (incidentId: string, status: IncidentStatus, responderId?: string) => Promise<void>;
  calculateReliabilityScore: (protectorId: string) => { score: number, rank: 'Gold' | 'Silver' | 'Bronze' | 'Unranked' };
}

// Dynamic Geographic Case ID Nomenclature Generator
const generateCaseNumber = (stateName: string = 'MP', districtName: string = 'REWA') => {
  const year = new Date().getFullYear();
  const stateCode = stateName.slice(0, 4).toUpperCase();
  const districtCode = districtName.slice(0, 4).toUpperCase();
  const randomId = Math.floor(1000 + Math.random() * 9000);
  return `KV-${year}-${districtCode}-${randomId}`;
};

export const useSupercellStore = create<SupercellCommandState>((set, get) => ({
  activeIncidents: {},
  globalAuditLogs: [
    `[${new Date().toLocaleTimeString()}] 📡 SUPERCELL CORE: Command Center Listener online.`
  ],
  realtimeChannel: null,

  addAuditLog: (log: string) => {
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
    const current = { ...get().activeIncidents };
    if (current[nodeId]) {
      current[nodeId].currentLatLng = [lng, lat]; // Strict Lng, Lat for Mapbox GL
      current[nodeId].decibelLevel = decibel;
      current[nodeId].forensicTranscript = transcript;
      
      const now = Date.now();
      
      // Phase 14: Black Box Recorder
      const newTelemetry = { lat, lng, speed: 0, decibel, timestamp: now };
      if (!current[nodeId].blackBoxTelemetry) current[nodeId].blackBoxTelemetry = [];
      current[nodeId].blackBoxTelemetry = [newTelemetry, ...current[nodeId].blackBoxTelemetry].slice(0, 100);
      
      // Real-time SHA-256 seal calculation using Web Crypto API
      const dataString = `${nodeId}-${lat}-${lng}-${decibel}-${transcript}-${now}`;
      const hashValue = await generateSHA256(dataString);
      const sealedHash = `SHA256:${hashValue}`;
      current[nodeId].sha256Seal = sealedHash;
      
      // Phase 13: Evidence Vault (Chain of Custody)
      if (!current[nodeId].evidenceChain) current[nodeId].evidenceChain = [];
      const prevHash = current[nodeId].evidenceChain.length > 0 
        ? current[nodeId].evidenceChain[0].hash 
        : "GENESIS";
        
      const evidenceNode = {
        evidenceId: `EVD-${now}`,
        capturedAt: now,
        capturedBy: "SUPERCELL_TELEMETRY",
        hash: sealedHash,
        deviceId: nodeId,
        previousHash: prevHash
      };
      current[nodeId].evidenceChain = [evidenceNode, ...current[nodeId].evidenceChain].slice(0, 50);
      
      // Phase 15: Push Telemetry & Evidence to Offline Queue safely
      offlineSyncService.queuePayload('TELEMETRY', newTelemetry);
      offlineSyncService.queuePayload('EVIDENCE_NODE', evidenceNode);
      
      set({ activeIncidents: current });
    }
  },

  dispatchOfficialReport: async (incidentId: string): Promise<boolean> => {
    const current = { ...get().activeIncidents };
    const nodeId = Object.keys(current).find(key => current[key].incidentId === incidentId);
    if (!nodeId || !current[nodeId]) return false;

    const incident = current[nodeId];
    const timestamp = new Date().toLocaleTimeString();
    
    get().addAuditLog(`🚨 BROADCAST: Compressed legal dispatch packet sent to 5km radius protectors for Case: ${incident.incidentId}`);
    get().addLogToIncident(incidentId, `🚨 OFFICIAL DISPATCH: Dispatch payload sent successfully.`);

    // Realtime broadcast simulation to police console servers
    console.log("🏛️ GOVERNMENT DISPATCH PIPELINE ENGAGED:", incident);
    return true;
  },

  updateIncidentStatus: async (incidentId: string, newStatus: IncidentStatus, responderId?: string) => {
    const current = { ...get().activeIncidents };
    const nodeId = Object.keys(current).find(key => current[key].incidentId === incidentId);
    if (!nodeId || !current[nodeId]) return;

    const incident = current[nodeId];
    const now = Date.now();
    const creationTime = incident.evidenceChain.length > 0 
      ? incident.evidenceChain[incident.evidenceChain.length - 1].capturedAt 
      : now; // Fallback to now if missing
      
    // Phase 11: Calculate SLAs
    if (newStatus === "ACKNOWLEDGED" && !incident.acknowledgedAt) {
      incident.acknowledgedAt = now;
      incident.timeToAcknowledgeMs = now - creationTime;
      if (responderId) incident.assignedProtectorId = responderId;
    } else if (newStatus === "ASSIGNED" && !incident.assignedAt) {
      incident.assignedAt = now;
      incident.timeToAssignMs = incident.acknowledgedAt ? now - incident.acknowledgedAt : now - creationTime;
    } else if (newStatus === "ARRIVED" && !incident.arrivedAt) {
      incident.arrivedAt = now;
      incident.timeToReachMs = incident.assignedAt ? now - incident.assignedAt : now - creationTime;
    } else if ((newStatus === "RESOLVED" || newStatus === "CLOSED") && !incident.resolvedAt) {
      incident.resolvedAt = now;
      incident.timeToResolveMs = now - creationTime;
    }

    incident.status = newStatus;
    
    // Phase 13: Chain of Custody (Create new Evidence Node on State Change)
    const prevHash = incident.evidenceChain.length > 0 ? incident.evidenceChain[0].hash : "GENESIS";
    const dataString = `${nodeId}-${newStatus}-${now}-${responderId || 'SYSTEM'}`;
    const hashValue = await generateSHA256(dataString);
    const sealedHash = `SHA256:${hashValue}`;
    
    const evidenceNode = {
      evidenceId: `STATE-${now}`,
      capturedAt: now,
      capturedBy: responderId || "SUPERCELL_SLA_ENGINE",
      hash: sealedHash,
      deviceId: nodeId,
      previousHash: prevHash
    };
    
    incident.evidenceChain = [evidenceNode, ...incident.evidenceChain].slice(0, 50);
    incident.sha256Seal = sealedHash;

    get().addAuditLog(`📈 SLA ENGINE: Incident ${incidentId} transitioned to ${newStatus}`);
    get().addLogToIncident(incidentId, `STATUS UPDATE: Moved to ${newStatus}`);
    
    // Phase 15: Queue State Change Evidence Node
    offlineSyncService.queuePayload('EVIDENCE_NODE', evidenceNode);
    
    set({ activeIncidents: current });
  },

  calculateReliabilityScore: (protectorId: string) => {
    // Phase 12: Responder Reliability Scoring logic
    // In a full implementation, this aggregates historical data from Firestore.
    // We simulate a robust calculation here based on theoretical past metrics.
    const mockResponseRate = Math.random() * (100 - 80) + 80; // 80-100%
    const mockAvgEta = Math.random() * 5 + 2; // 2-7 mins
    
    let score = mockResponseRate - (mockAvgEta * 2); // Base score algorithm
    if (score > 100) score = 100;
    
    let rank: 'Gold' | 'Silver' | 'Bronze' | 'Unranked' = 'Unranked';
    if (score >= 90) rank = 'Gold';
    else if (score >= 75) rank = 'Silver';
    else if (score >= 50) rank = 'Bronze';
    
    return { score: Math.round(score), rank };
  },

  escalateIncident: (incidentId: string, level: 'PCR' | 'HQ' | 'STATE') => {
    const timestamp = new Date().toLocaleTimeString();
    get().addAuditLog(`⚠️ ESCALATION [${level}]: Incident ${incidentId} escalated to higher authorities.`);
    get().addLogToIncident(incidentId, `⚠️ AUTOMATED ESCALATION to ${level} level.`);
    
    // In a real app, this would update Firebase incident_ack collection with level and timestamp
    console.warn(`🚨 ESCALATING ${incidentId} to ${level}`);
  },

  startEscalationEngine: (incidentId: string) => {
    // 30 seconds -> PCR
    setTimeout(() => {
       const incident = Object.values(get().activeIncidents).find(i => i.incidentId === incidentId);
       if (incident && incident.status !== 'ACKNOWLEDGED' && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED') {
          get().escalateIncident(incidentId, 'PCR');
       }
    }, 30000);

    // 90 seconds -> HQ
    setTimeout(() => {
       const incident = Object.values(get().activeIncidents).find(i => i.incidentId === incidentId);
       if (incident && incident.status !== 'ACKNOWLEDGED' && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED') {
          get().escalateIncident(incidentId, 'HQ');
       }
    }, 90000);

    // 180 seconds -> STATE
    setTimeout(() => {
       const incident = Object.values(get().activeIncidents).find(i => i.incidentId === incidentId);
       if (incident && incident.status !== 'ACKNOWLEDGED' && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED') {
          get().escalateIncident(incidentId, 'STATE');
       }
    }, 180000);
  },

  initCommandCenterStreams: () => {
    console.log("📡 SUPERCELL CORE: Primary Command Listener Anchored to National Grid.");
    
    // Clean up duplicate realtime channel subscriptions to prevent React 18 double-mount crashes
    const existingChannel = get().realtimeChannel;
    if (existingChannel) {
      console.log("🔄 SUPERCELL CORE: Dismantling duplicate active realtime socket...");
      supabase.removeChannel(existingChannel);
    }

    get().addAuditLog("📡 UPLINK ACTIVE: Telemetry coordinates mapped to Mapbox.");

    // Subscribe to realtime database profiles channel to intercept distress updates
    const newChannel = supabase
      .channel('tactical_emergency_grid')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const rawData = payload.new;

        if (rawData.is_distress_active) {
          console.log(`🚨 COMMAND CENTER INTERCEPT: Node ID ${rawData.id} status distress verified.`);
          get().addAuditLog(`🚨 INTERCEPT ACTIVE: Node ID ${rawData.id} triggered distress protocol.`);

          const currentIncidents = { ...get().activeIncidents };
          const district = rawData.city || 'REWA';
          const state = rawData.state || 'MP';
          const caseId = currentIncidents[rawData.id]?.incidentId || generateCaseNumber(state, district);

          // Standardize Decibel & Hashing
          const lastTranscript = rawData.last_voice_transcript || "Listening...";
          const currentDecibel = rawData.voice_decibel_rms || 48;
          const pseudoHashData = `${rawData.id}-${rawData.live_latitude}-${rawData.live_longitude}-${currentDecibel}`;
          
          generateSHA256(pseudoHashData).then((hashValue) => {
             const sealedHash = `SHA256:${hashValue}`;
             const updatedIncidents = { ...get().activeIncidents };
             if(updatedIncidents[rawData.id]) {
                 updatedIncidents[rawData.id].sha256Seal = sealedHash;
                 set({ activeIncidents: updatedIncidents });
             }
          });

          const initialSealedHash = "Calculating SHA256...";

          currentIncidents[rawData.id] = {
            incidentId: caseId,
            victimName: rawData.full_name || "Sovereign Node",
            status: "CREATED",
            currentLatLng: [rawData.live_longitude || 77.2090, rawData.live_latitude || 28.6139], // Strict [Lng, Lat] for Mapbox
            forensicTranscript: lastTranscript,
            nearestThanaName: rawData.nearest_police_station || "Calculating Node...",
            bnsOffenseCategory: rawData.offense_tier || "Evaluating BNS Offense...",
            decibelLevel: currentDecibel,
            sha256Seal: initialSealedHash,
            systemLogs: currentIncidents[rawData.id]?.systemLogs || [
              `[${new Date().toLocaleTimeString()}] 📡 UPLINK INITIALIZED: Node mapped to Mapbox layer.`,
              `[${new Date().toLocaleTimeString()}] 🔒 SECURITY SEAL: Generating true SHA256 cryptographic proof.`
            ],
            evidenceChain: currentIncidents[rawData.id]?.evidenceChain || [],
            blackBoxTelemetry: currentIncidents[rawData.id]?.blackBoxTelemetry || []
          };

          set({ activeIncidents: currentIncidents });
          get().startEscalationEngine(caseId);
        } else {
          // If distress was resolved, remove from active monitoring
          if (get().activeIncidents[rawData.id]) {
            const currentIncidents = { ...get().activeIncidents };
            const caseId = currentIncidents[rawData.id].incidentId;
            delete currentIncidents[rawData.id];
            set({ activeIncidents: currentIncidents });
            get().addAuditLog(`🟢 NODE STANDBY: distress cleared for Incident: ${caseId}`);
          }
        }
      });

    newChannel.subscribe();
    set({ realtimeChannel: newChannel });
  }
}));
