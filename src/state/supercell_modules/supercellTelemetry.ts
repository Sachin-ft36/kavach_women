import { offlineSyncService } from '../../services/offlineSyncService';
import { cryptoService } from '../../services/cryptoService';
import { generateSHA256 } from '../../utils/supercellUtils';
import { IncidentCluster } from '../../types/supercell';

export const updateTelemetryLogic = async (
  currentIncidents: Record<string, IncidentCluster>,
  nodeId: string,
  lat: number,
  lng: number,
  decibel: number = 45,
  transcript: string = "Listening..."
): Promise<Record<string, IncidentCluster> | null> => {
  const current = { ...currentIncidents };
  if (!current[nodeId]) return null;

  current[nodeId].currentLatLng = [lng, lat]; // Strict Lng, Lat for Mapbox GL
  current[nodeId].decibelLevel = decibel;
  current[nodeId].forensicTranscript = transcript;
  
  const now = Date.now();
  
  // Phase 14: Black Box Recorder (Removed from Zustand memory for scalability)
  const newTelemetry = { lat, lng, speed: 0, decibel, timestamp: now };
  
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
    previousHash: prevHash,
    digitalSignature: await cryptoService.signPayload(sealedHash),
    publicKey: await cryptoService.getPublicKeyBase64()
  };
  current[nodeId].evidenceChain = [evidenceNode, ...current[nodeId].evidenceChain].slice(0, 50);
  
  // Phase 15: Push Telemetry & Evidence to Offline Queue safely
  offlineSyncService.queuePayload('TELEMETRY', newTelemetry);
  offlineSyncService.queuePayload('EVIDENCE_NODE', evidenceNode);
  
  return current;
};
