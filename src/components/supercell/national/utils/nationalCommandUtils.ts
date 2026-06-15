export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const parseIncidentData = (
  selectedAlertId: string | null,
  activeAlerts: any[],
  customLogs: string[],
  selectedState: string
) => {
  if (!selectedAlertId) return null;
  const alert = activeAlerts.find(a => a.id === selectedAlertId);
  if (!alert) return null;

  const aLat = alert.latitude || alert.location?.lat;
  const aLng = alert.longitude || alert.location?.lng;
  const cityFallback = aLat ? `Sector ${aLat.toFixed(1)}N, ${aLng.toFixed(1)}E` : 'HQ Sector';
  
  const isValid = (val: any) => val && typeof val === 'string' && !val.includes('Unknown') && !val.includes('Neutral Zone') && !val.includes('Grid Sector') && !val.includes('Classified');

  const city: string =
    (isValid(alert.city) && alert.city) ||
    (isValid(alert.district) && alert.district) ||
    (isValid(alert.locationCity) && alert.locationCity) ||
    (isValid(alert.victimCity) && alert.victimCity) ||
    (isValid(alert.address?.split(',')[0]?.trim()) && alert.address?.split(',')[0]?.trim()) ||
    (isValid(alert.locationName?.split(',')[0]?.trim()) && alert.locationName?.split(',')[0]?.trim()) ||
    cityFallback;

  const stateName: string =
    alert.state ||
    alert.locationState ||
    alert.victimState ||
    (selectedState !== 'ALL' ? selectedState : 'Unknown State');

  const stateCode: string = stateName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3);
  const year = new Date().getFullYear();
  const seed = alert.id?.slice(-4)?.toUpperCase() || '0000';
  const caseId = `CASE-${stateCode}-${year}-${city.slice(0, 3).replace(/[^A-Z]/gi, '').toUpperCase() || 'GRI'}-${seed}`;
  const victimName: string = alert.victimName || alert.userName || alert.name || 'Distress Node';

  const baselineLogs: string[] = [];
  if (alert.timestamp) {
    let dateVal: Date;
    if (typeof alert.timestamp.toDate === 'function') {
      dateVal = alert.timestamp.toDate();
    } else if (alert.timestamp.seconds) {
      dateVal = new Date(alert.timestamp.seconds * 1000);
    } else if (typeof alert.timestamp.toMillis === 'function') {
      dateVal = new Date(alert.timestamp.toMillis());
    } else {
      dateVal = new Date(alert.timestamp);
    }
    const timeStr = isNaN(dateVal.getTime()) ? new Date().toLocaleTimeString() : dateVal.toLocaleTimeString();
    baselineLogs.push(`[${timeStr}] SOS Signal registered at ${city} coordinates.`);
  }
  
  if (alert.audioUrl || alert.stealthAudio) baselineLogs.push(`[${new Date().toLocaleTimeString()}] STEALTH MIC ACTIVE: Audio uplink established for ${victimName}.`);
  if (alert.escapeVectorActive) baselineLogs.push(`[${new Date().toLocaleTimeString()}] ALERT: Target crossing ${city} boundaries. State escalation triggered.`);
  if (alert.nakabandiDeployed) baselineLogs.push(`[${new Date().toLocaleTimeString()}] NHAI TOLL LOCKDOWN: Physical boom barriers disabled by command.`);
  
  if (baselineLogs.length === 0) baselineLogs.push(`> Listening for live telemetry on port 8080...`);

  const allLogs = [...customLogs, ...baselineLogs].slice(0, 20);

  return {
    caseId, city, stateName, victimName, incidentId: caseId,
    address: alert.fullAddress || (isValid(alert.address) ? alert.address : (isValid(alert.locationName) ? alert.locationName : (aLat ? `GPS: ${aLat.toFixed(5)}, ${aLng.toFixed(5)}` : 'Classified Geo-Grid'))),
    forensicTranscript: alert.audioTranscript 
      ? `[TRANSCRIPT] ${alert.audioTranscript}`
      : (alert.audioUrl || alert.stealthAudio) ? "Live audio stream locked. Decrypting voice telemetry..." : "No active audio uplink detected from the primary device.",
    nearestThanaName: alert.nearestPoliceStation || alert.policeStation || `${city} HQ Precinct (Awaiting API Sync)`,
    bnsOffenseCategory: 'BNSS Sec 63 Chain (Immediate Cognizance)',
    systemLogs: allLogs,
    nearbyTolls: alert.nearbyTolls || null
  };
};

export const generateSimulatedPcrVans = (
  incidentData: any,
  activeAlerts: any[],
  selectedAlertId: string | null,
  livePcrOfficers: any[]
) => {
  const city = incidentData?.city || 'Local';
  const alert = activeAlerts.find(a => a.id === selectedAlertId);
  const aLat = alert?.latitude || alert?.location?.lat || 24.5797;
  const aLng = alert?.longitude || alert?.location?.lng || 81.3317;

  // Filter for on-duty PCR officers or protectors
  const activeUnits = livePcrOfficers.filter(o => o.isOnDuty === true || o.status === 'responding' || o.lastLocation || o.latitude);

  const realVans = activeUnits.map(officer => {
    const pLat = officer.lastLocation?.latitude || officer.lastLocation?.lat || officer.latitude || 0;
    const pLng = officer.lastLocation?.longitude || officer.lastLocation?.lng || officer.longitude || 0;
    const distKm = (aLat && aLng && pLat && pLng) ? calculateDistance(aLat, aLng, pLat, pLng) : (Math.random() * 2 + 0.5);
    const etaMins = Math.ceil(distKm / 0.4);
    return {
      id: officer.id,
      name: officer.vehicleNo || `${city} PCR Unit`,
      officer: `${officer.rank || 'Protector'} ${officer.name || officer.displayName || 'On Duty'}`,
      distance: `${distKm.toFixed(1)} km`,
      delay: `${etaMins} mins`,
      uid: officer.id,
      isReal: true
    };
  }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  return realVans;
};
