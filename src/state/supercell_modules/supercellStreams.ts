import { supabase } from '../../lib/supabase';
import { generateCaseNumber, generateSHA256 } from '../../utils/supercellUtils';
import { RealtimeChannel } from '@supabase/supabase-js';

export const initCommandCenterStreamsLogic = (
  existingChannel: RealtimeChannel | null,
  addAuditLog: (msg: string) => void,
  getActiveIncidents: () => any,
  setIncidents: (incidents: any) => void,
  startEscalationEngine: (id: string) => void,
  setChannel: (channel: RealtimeChannel) => void
) => {
  console.log("📡 SUPERCELL CORE: Primary Command Listener Anchored to National Grid.");
  
  // Clean up duplicate realtime channel subscriptions to prevent React 18 double-mount crashes
  if (existingChannel) {
    console.log("🔄 SUPERCELL CORE: Dismantling duplicate active realtime socket...");
    supabase.removeChannel(existingChannel);
  }

  addAuditLog("📡 UPLINK ACTIVE: Telemetry coordinates mapped to Mapbox.");

  // Subscribe to realtime database profiles channel to intercept distress updates
  const newChannel = supabase
    .channel('tactical_emergency_grid')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
      const rawData = payload.new;

      if (rawData.is_distress_active) {
        console.log(`🚨 COMMAND CENTER INTERCEPT: Node ID ${rawData.id} status distress verified.`);
        addAuditLog(`🚨 INTERCEPT ACTIVE: Node ID ${rawData.id} triggered distress protocol.`);

        const currentIncidents = { ...getActiveIncidents() };
        const district = rawData.city || 'REWA';
        const state = rawData.state || 'MP';
        const caseId = currentIncidents[rawData.id]?.incidentId || generateCaseNumber(state, district);

        // Standardize Decibel & Hashing
        const lastTranscript = rawData.last_voice_transcript || "Listening...";
        const currentDecibel = rawData.voice_decibel_rms || 48;
        const pseudoHashData = `${rawData.id}-${rawData.live_latitude}-${rawData.live_longitude}-${currentDecibel}`;
        
        generateSHA256(pseudoHashData).then((hashValue) => {
           const sealedHash = `SHA256:${hashValue}`;
           const updatedIncidents = { ...getActiveIncidents() };
           if(updatedIncidents[rawData.id]) {
               updatedIncidents[rawData.id].sha256Seal = sealedHash;
               setIncidents(updatedIncidents);
           }
        });

        const initialSealedHash = "Calculating SHA256...";

        currentIncidents[rawData.id] = {
          incidentId: caseId,
          victimName: rawData.full_name || "Sovereign Node",
          status: "CREATED",
          incidentVersion: 1,
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
          evidenceChain: currentIncidents[rawData.id]?.evidenceChain || []
        };

        setIncidents(currentIncidents);
        startEscalationEngine(caseId);
      } else {
        // If distress was resolved, remove from active monitoring
        const currentIncidents = { ...getActiveIncidents() };
        if (currentIncidents[rawData.id]) {
          const caseId = currentIncidents[rawData.id].incidentId;
          delete currentIncidents[rawData.id];
          setIncidents(currentIncidents);
          addAuditLog(`🟢 NODE STANDBY: distress cleared for Incident: ${caseId}`);
        }
      }
    });

  newChannel.subscribe();
  setChannel(newChannel);
};
