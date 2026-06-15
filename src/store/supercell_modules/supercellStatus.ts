import { offlineSyncService } from '../../services/offlineSyncService';
import { cryptoService } from '../../services/cryptoService';
import { generateSHA256 } from '../../utils/supercellUtils';
import { IncidentStatus, IncidentCluster } from '../../types/supercell';
import { validateTransition, StateTransitionError } from '../../utils/stateGuards';
import { computeIncidentSLA } from '../../utils/supercellLogicUtils';
import { archiveIncident } from '../../services/sosService';

export const updateIncidentStatusLogic = async (
  currentIncidents: Record<string, IncidentCluster>,
  incidentId: string,
  newStatus: IncidentStatus,
  responderId?: string,
  addAuditLog?: (msg: string, type?: string) => void,
  addLogToIncident?: (id: string, log: string) => void
): Promise<Record<string, IncidentCluster> | null> => {
  const current = { ...currentIncidents };
  const nodeId = Object.keys(current).find(key => current[key].incidentId === incidentId);
  if (!nodeId || !current[nodeId]) return null;

  const incident = current[nodeId];
  
  // Phase 6: Validate State Transition
  if (!validateTransition(incident.status, newStatus, 'COMMAND')) {
    console.error(new StateTransitionError(incident.status, newStatus));
    if (addAuditLog) addAuditLog(`⛔ SECURITY AUDIT: Blocked invalid transition from ${incident.status} to ${newStatus} for ${incidentId}`);
    return null;
  }

  const now = Date.now();
  
  // Phase 11: Calculate SLAs
  computeIncidentSLA(incident, newStatus, responderId);

  incident.status = newStatus;
  incident.incidentVersion += 1;
  
  // Phase B: Hash Chain Validation
  let isTampered = false;
  let tamperLevel: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'|null = null;
  
  if (incident.evidenceChain.length > 0) {
    const lastNode = incident.evidenceChain[0];
    if (!lastNode.hash || !lastNode.digitalSignature) {
      isTampered = true;
      tamperLevel = 'HIGH';
    }
  }

  const prevHash = incident.evidenceChain.length > 0 ? incident.evidenceChain[0].hash : "GENESIS";
  const dataString = `${nodeId}-${newStatus}-${now}-${responderId || 'SYSTEM'}`;
  const hashValue = await generateSHA256(dataString);
  const sealedHash = `SHA256:${hashValue}`;
  
  if (isTampered) {
    incident.incidentTampered = true;
    incident.tamperLevel = tamperLevel || 'CRITICAL';
    if (addAuditLog) addAuditLog(`🚨 TAMPER [${tamperLevel}]: Hash chain anomaly detected for ${incidentId}`, 'Tamper');
  }

  const evidenceNode = {
    evidenceId: `STATE-${now}`,
    capturedAt: now,
    capturedBy: responderId || "SUPERCELL_SLA_ENGINE",
    hash: sealedHash,
    deviceId: nodeId,
    previousHash: prevHash,
    digitalSignature: await cryptoService.signPayload(sealedHash),
    publicKey: await cryptoService.getPublicKeyBase64()
  };
  
  incident.evidenceChain = [evidenceNode, ...incident.evidenceChain].slice(0, 50);
  incident.sha256Seal = sealedHash;

  // Phase B: Audit Event Stream Dispatch
  let eventType: string = newStatus;
  if (newStatus === 'ACKNOWLEDGED') eventType = 'ACK';
  else if (newStatus === 'ASSIGNED') eventType = 'Assign';
  else if (newStatus === 'RESOLVED') eventType = 'Resolve';
  else if (newStatus === 'CLOSED') eventType = 'Close';

  if (addAuditLog) addAuditLog(`📈 AUDIT [${eventType}]: Incident ${incidentId} transitioned to ${newStatus}`, eventType);
  if (addLogToIncident) addLogToIncident(incidentId, `STATUS UPDATE: Moved to ${newStatus}`);
  
  // Phase 15: Queue State Change Evidence Node
  offlineSyncService.queuePayload('EVIDENCE_NODE', evidenceNode);
  
  // Phase 7: Telemetry Scaling (Hot Data -> Cold Archive)
  if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      await updateDoc(doc(db, 'alerts', incidentId), {
        status: newStatus.toLowerCase(),
        lastUpdateAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to update status in Firestore before archiving", e);
    }
    await archiveIncident(incidentId);
  }

  return current;
};
