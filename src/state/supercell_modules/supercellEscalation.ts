export const startEscalationEngineLogic = (
  incidentId: string,
  getActiveIncidents: () => any,
  addAuditLog: (msg: string, type?: string) => void,
  escalateIncident: (id: string, level: 'PCR' | 'HQ' | 'STATE', reason: string) => void
) => {
  // Configurable SLA Engine Thresholds
  const slaConfig = {
    ackThresholdSec: 30,
    arrivalThresholdMin: 10
  };

  // ACK SLA Check
  setTimeout(() => {
     const incident = Object.values(getActiveIncidents()).find((i: any) => i.incidentId === incidentId) as any;
     if (incident && incident.status !== 'ACKNOWLEDGED' && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED') {
        addAuditLog(`⏳ AUDIT [SlaBreach]: ACK SLA (${slaConfig.ackThresholdSec}s) breached for ${incidentId}`, 'SlaBreach');
        escalateIncident(incidentId, 'PCR', 'ACK SLA Breach');
     }
  }, 30000);

  // 90 seconds -> HQ
  setTimeout(() => {
     const incident = Object.values(getActiveIncidents()).find((i: any) => i.incidentId === incidentId) as any;
     if (incident && incident.status !== 'ACKNOWLEDGED' && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED') {
        escalateIncident(incidentId, 'HQ', '90s Threshold Reached');
     }
  }, 90000);

  // 180 seconds -> STATE
  setTimeout(() => {
     const incident = Object.values(getActiveIncidents()).find((i: any) => i.incidentId === incidentId) as any;
     if (incident && incident.status !== 'ACKNOWLEDGED' && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED') {
        escalateIncident(incidentId, 'STATE', '180s Threshold Reached');
     }
  }, 180000);
};
