import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../../../firebase';

export function useKavachDirectoryData(
  womenUsers: any[],
  protectors: any[],
  activeTab: 'WOMEN' | 'PROTECTORS' | 'ALL',
  searchQuery: string
) {
  const [resolvedLocations, setResolvedLocations] = useState<Record<string, { address?: string; pincode?: string; state?: string; name?: string | null; relation?: string; phone?: string; }>>({});
  
  const allUsers = useMemo(() => {
    const registry: Record<string, any> = {};
    
    [...womenUsers, ...protectors].forEach(u => {
      if (!registry[u.id]) {
        registry[u.id] = { ...u };
      } else {
        if (u.role === 'protector' || registry[u.id].role === 'protector') {
           registry[u.id].isDualRole = true;
           registry[u.id].role = 'protector';
        }
      }
    });

    return Object.values(registry).sort((a: any, b: any) => {
       const nameA = (a.name || '').toLowerCase();
       const nameB = (b.name || '').toLowerCase();
       return nameA.localeCompare(nameB);
    });
  }, [womenUsers, protectors]);

  const mergedWomenUsers = useMemo(() => allUsers.filter(u => u.gender?.toUpperCase() === 'FEMALE' || u.role?.toLowerCase() === 'citizen'), [allUsers]);
  const mergedProtectors = useMemo(() => allUsers.filter(u => u.role?.toLowerCase() === 'protector'), [allUsers]);

  const filteredData = (activeTab === 'ALL' ? allUsers : activeTab === 'WOMEN' ? mergedWomenUsers : mergedProtectors)
    .filter(u => {
      const q = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q) ||
        u.aadhaar?.toLowerCase().includes(q) ||
        u.aadhar?.toLowerCase().includes(q)
      );
    });

  useEffect(() => {
    const resolveMetadata = async () => {
      const usersToResolveAddr = filteredData.filter(u => !resolvedLocations[u.id] && u.lastLocation?.lat && u.lastLocation?.lng);
      for (const user of usersToResolveAddr) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${user.lastLocation.lat}&lon=${user.lastLocation.lng}&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.suburb || addr.neighbourhood || '';
            const city = addr.city || addr.town || addr.village || addr.district || 'Unknown City';
            const state = addr.state || 'Unknown State';
            const fullAddress = `${street}${street ? ', ' : ''}${city}, ${state}`.trim();
            setResolvedLocations(prev => ({ ...prev, [user.id]: { address: fullAddress, pincode: addr.postcode || 'N/A', state: state } }));
          }
          await new Promise(r => setTimeout(r, 800));
        } catch (err) {}
      }

      const usersToResolveGuardians = filteredData.filter(u => !u.primaryGuardian && !resolvedLocations[`g_${u.id}`]);
      
      for (const user of usersToResolveGuardians) {
        try {
          const gSnap = await getDocs(query(collection(db, 'users', user.id, 'guardians'), limit(1)));
          if (!gSnap.empty) {
            const gData = gSnap.docs[0].data();
            setResolvedLocations(prev => ({
              ...prev,
              [`g_${user.id}`]: { name: gData.name, relation: gData.relation, phone: gData.phone }
            }));
          } else {
            setResolvedLocations(prev => ({ ...prev, [`g_${user.id}`]: { name: null } }));
          }
        } catch (err) {}
      }
    };

    if (filteredData.length > 0) resolveMetadata();
  }, [filteredData, activeTab]);

  return {
    allUsers,
    mergedWomenUsers,
    mergedProtectors,
    filteredData,
    resolvedLocations
  };
}
