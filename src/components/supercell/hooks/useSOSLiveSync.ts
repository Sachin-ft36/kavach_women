import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { IncidentRecord } from '../../../state/slices/types';

export function useSOSLiveSync(
  selectedAlertId: string | null,
  selectedVictimId: string | null,
  sidebarTab: 'LIVE' | 'HISTORY',
  activeAlerts: IncidentRecord[],
  historicalAlerts: IncidentRecord[]
) {
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [nearbyPolice, setNearbyPolice] = useState<any[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [guardians, setGuardians] = useState<any[]>([]);
  const lastQueriedCoords = React.useRef<{ id: string | null; lat: number; lng: number } | null>(null);

  useEffect(() => {
    const selectedAlert = (sidebarTab === 'LIVE' ? activeAlerts : historicalAlerts).find(a => a.id === selectedAlertId);
    
    const lat = selectedAlert?.latitude || selectedAlert?.lat || selectedAlert?.location?.latitude || selectedAlert?.location?.lat;
    const lng = selectedAlert?.longitude || selectedAlert?.lng || selectedAlert?.location?.longitude || selectedAlert?.location?.lng;
    
    if (lat && lng) {
      const didIdChange = lastQueriedCoords.current === null || lastQueriedCoords.current.id !== selectedAlertId;
      const distShift = lastQueriedCoords.current 
        ? Math.abs(lat - lastQueriedCoords.current.lat) > 0.0003 || Math.abs(lng - lastQueriedCoords.current.lng) > 0.0003 
        : true;

      if (didIdChange || distShift) {
        lastQueriedCoords.current = { id: selectedAlertId, lat, lng };

        const resolveAddr = async () => {
          setLoadingAddress(true);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setResolvedAddress(data.display_name || "Verified GPS Signal");
          } catch (e) { setResolvedAddress("Tactical Resolution Failed"); }
          finally { setLoadingAddress(false); }
        };
        resolveAddr();

        const fetchNodes = async () => {
          setLoadingNodes(true);
          try {
            const { fetchNearbyPoliceMappls, fetchNearbyHospitalsMappls, isOfficialPoliceStation } = await import('../../../services/MapplsService');
            
            let police = await fetchNearbyPoliceMappls(lat, lng);
            let hospitals = await fetchNearbyHospitalsMappls(lat, lng);

            const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

            if (!police || police.length === 0) {
              try {
                const url = `https://api.mapbox.com/search/searchbox/v1/category/police?proximity=${lng},${lat}&limit=5&access_token=${MAPBOX_TOKEN}`;
                const response = await fetch(url);
                const resData = await response.json();
                
                if (resData && Array.isArray(resData.features) && resData.features.length > 0) {
                  police = resData.features.map((f: any) => {
                    const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
                    const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
                    
                    return {
                      id: f.properties?.mapbox_id || f.id || Math.random().toString(),
                      name: f.properties?.name || f.properties?.full_address || "Local Police Station",
                      address: f.properties?.full_address || "Nearby",
                      phone: "112",
                      lat: fLat,
                      lng: fLng
                    };
                  }).filter((s: any) => isOfficialPoliceStation(s.name));
                }
              } catch (err) {
                console.error("Mapbox Police Fallback Failed:", err);
              }
            }

            if (!hospitals || hospitals.length === 0) {
              try {
                const url = `https://api.mapbox.com/search/searchbox/v1/category/hospital?proximity=${lng},${lat}&limit=5&access_token=${MAPBOX_TOKEN}`;
                const response = await fetch(url);
                const resData = await response.json();
                
                if (resData && Array.isArray(resData.features) && resData.features.length > 0) {
                  hospitals = resData.features.map((f: any) => {
                    const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
                    const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
                    
                    return {
                      id: f.properties?.mapbox_id || f.id || Math.random().toString(),
                      name: f.properties?.name || f.properties?.full_address || "Local Hospital",
                      address: f.properties?.full_address || "Nearby",
                      phone: "108",
                      lat: fLat,
                      lng: fLng
                    };
                  });
                }
              } catch (err) {
                console.error("Mapbox Hospital Fallback Failed:", err);
              }
            }

            setNearbyPolice((police || []).slice(0, 2));
            setNearbyHospitals((hospitals || []).slice(0, 2));
          } catch (error) {
            console.error("Failed to fetch nearby emergency nodes in SOSManagement:", error);
          } finally {
            setLoadingNodes(false);
          }
        };
        fetchNodes();
      }
    } else { 
      setResolvedAddress(null);
      setNearbyPolice([]);
      setNearbyHospitals([]);
      lastQueriedCoords.current = null;
    }

    const currentVictimId = sidebarTab === 'LIVE'
      ? ((selectedAlert as any)?.victimUid || (selectedAlert as any)?.uid || (selectedAlert as any)?.userId)
      : selectedVictimId;
    
    let unsub1 = () => {};
    let unsub2 = () => {};
    if (currentVictimId) {
      const gRef1 = collection(db, 'users', currentVictimId, 'guardians');
      const gRef2 = collection(db, 'women_users', currentVictimId, 'safety_data');
      
      unsub1 = onSnapshot(gRef1, (snap) => {
        if (!snap.empty) setGuardians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        else setGuardians([]);
      });
      unsub2 = onSnapshot(gRef2, (snap) => {
        if (!snap.empty) setGuardians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        else setGuardians([]);
      });
    } else {
      setGuardians([]);
    }
    return () => { unsub1(); unsub2(); };
  }, [selectedAlertId, selectedVictimId, sidebarTab, activeAlerts, historicalAlerts]);

  return {
    resolvedAddress,
    loadingAddress,
    nearbyPolice,
    nearbyHospitals,
    loadingNodes,
    guardians
  };
}
