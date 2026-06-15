import React from 'react';
import { IncidentRecord, UserProfile, ZeroFIRRecord, JourneyRecord } from '../domain/types';

// ── State abbreviation variations for smart matching ──
const getStateVariations = (stateName: string): string[] => {
  const name = stateName.toLowerCase().trim();
  const variations = [name];

  if (name === 'uttar pradesh') variations.push('up', 'u.p.', 'uttarpradesh');
  else if (name === 'maharashtra') variations.push('mh', 'm.h.');
  else if (name === 'delhi') variations.push('dl', 'd.l.');
  else if (name === 'karnataka') variations.push('ka', 'k.a.');
  else if (name === 'rajasthan') variations.push('rj', 'r.j.');
  else if (name === 'west bengal') variations.push('wb', 'w.b.');
  else if (name === 'madhya pradesh') variations.push('mp', 'm.p.');
  else if (name === 'andhra pradesh') variations.push('ap', 'a.p.');
  else if (name === 'jammu and kashmir') variations.push('jk', 'j&k', 'j & k', 'jammu & kashmir');
  else if (name === 'punjab') variations.push('pb', 'p.b.');
  else if (name === 'haryana') variations.push('hr', 'h.r.');
  else if (name === 'gujarat') variations.push('gj', 'g.j.');
  else if (name === 'bihar') variations.push('br', 'b.r.');
  else if (name === 'tamil nadu') variations.push('tn', 't.n.');
  else if (name === 'telangana') variations.push('ts', 't.s.');

  return variations;
};

export const matchesState = (selectedState: string, text: string) => {
  if (!text) return false;
  const lowerText = text.toLowerCase().trim();
  const selectedVariations = getStateVariations(selectedState);

  if (selectedVariations.includes(lowerText)) return true;

  return selectedVariations.some(variation => {
    if (variation.length <= 4) {
      const regex = new RegExp(`\\b${variation.replace('.', '\\.')}\\b`, 'i');
      return regex.test(lowerText);
    }
    return lowerText.includes(variation);
  });
};

interface FilterParams {
  selectedState: string;
  detectedAdminDistrict: string | null;
  userStatusMap: Record<string, UserProfile>;
}

export function useStateFilter(params: FilterParams) {
  const { selectedState, detectedAdminDistrict, userStatusMap } = params;

  const filterByState = React.useCallback((itemBase: IncidentRecord | UserProfile | ZeroFIRRecord | JourneyRecord): boolean => {
    if (!itemBase) return false;
    if (selectedState === 'ALL') return true;

    const item = itemBase as Record<string, any>;

    // District filter for district admins
    if (detectedAdminDistrict) {
      const district = detectedAdminDistrict.toLowerCase();
      const city = (item.city || item.location?.city || item.incidentLocation?.city || '').toLowerCase();
      const addr = (
        item.address || item.locationName || item.fullAddress ||
        item.location?.address || item.incidentLocation?.display ||
        item.policeStation || item.policeStationGeo?.address || ''
      ).toLowerCase();
      const state = (item.state || '').toLowerCase();
      const districtMatch = city.includes(district) || addr.includes(district);
      const stateMatch = !state || state === 'national' || matchesState(selectedState, state);
      return districtMatch && stateMatch;
    }

    if (selectedState === 'ALL') return true;
    if (item.state && matchesState(selectedState, item.state)) return true;
    if (item.address && matchesState(selectedState, item.address)) return true;
    if (item.locationName && matchesState(selectedState, item.locationName)) return true;
    if (item.incidentAddress && matchesState(selectedState, item.incidentAddress)) return true;
    if (item.city && matchesState(selectedState, item.city)) return true;
    if (item.fullAddress && matchesState(selectedState, item.fullAddress)) return true;

    const uUid = String(item.victimUid || item.userId || item.uid);
    if (uUid && uUid !== 'undefined' && userStatusMap[uUid]) {
      const profile = userStatusMap[uUid];
      if (profile.state && matchesState(selectedState, profile.state)) return true;
      if (profile.address && matchesState(selectedState, profile.address)) return true;
      if (profile.city && matchesState(selectedState, profile.city)) return true;
      if (profile.fullAddress && matchesState(selectedState, profile.fullAddress)) return true;
    }

    return false;
  }, [selectedState, detectedAdminDistrict, userStatusMap]);

  const buildFilteredUserStatusMap = React.useCallback((
    activeAlerts: IncidentRecord[],
    missionHistory: IncidentRecord[],
    activeFirs: ZeroFIRRecord[]
  ): Record<string, UserProfile> => {
    const filtered: Record<string, UserProfile> = {};

    const userIdsWithAlertsInSelectedState = new Set<string>();
    [...activeAlerts, ...missionHistory, ...activeFirs].forEach(itemBase => {
      if (filterByState(itemBase)) {
        const item = itemBase as Record<string, any>;
        const uUid = String(item.victimUid || item.userId || item.uid);
        if (uUid && uUid !== 'undefined') userIdsWithAlertsInSelectedState.add(uUid);
      }
    });

    Object.entries(userStatusMap).forEach(([uid, user]) => {
      if (selectedState === 'ALL') {
        filtered[uid] = user;
      } else if (filterByState(user) || userIdsWithAlertsInSelectedState.has(uid) || userIdsWithAlertsInSelectedState.has(user.id)) {
        filtered[uid] = user;
      }
    });

    if (selectedState !== 'ALL') {
      const injectFromList = (list: (IncidentRecord | ZeroFIRRecord)[], role: string) => {
        list.forEach(itemBase => {
          if (!filterByState(itemBase)) return;
          const item = itemBase as Record<string, any>;
          const uid = String(item.victimUid || item.userId || item.uid);
          if (uid && uid !== 'undefined' && !filtered[uid] && !userStatusMap[uid]) {
            filtered[uid] = {
              id: uid,
              name: item.victimName || item.userName || 'Anonymous citizen',
              role,
              gender: item.gender || 'FEMALE',
              phoneNumber: item.phoneNumber || item.phone || 'DATA_NOT_SYNCED',
              email: item.email || 'N/A',
              aadhaar: item.aadhaar || item.aadhar || 'DATA_NOT_SYNCED',
              state: selectedState,
              city: item.city || item.address || 'Sector Unknown',
              address: item.address || item.city || 'Sector Unknown',
              isVerified: true
            };
          }
        });
      };

      injectFromList(activeAlerts, 'citizen');
      injectFromList(missionHistory, 'citizen');
      injectFromList(activeFirs, 'citizen');
    }

    return filtered;
  }, [filterByState, selectedState, userStatusMap]);

  return { filterByState, buildFilteredUserStatusMap };
}
