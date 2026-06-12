import { getOfficialPolicePhone } from '../../utils/policePhoneUtils';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

export const executeMapboxPoliceBackup = async (lat: number, lng: number) => {
  if (!MAPBOX_TOKEN) return [];
  try {
    const url = `https://api.mapbox.com/search/searchbox/v1/category/police?proximity=${lng},${lat}&limit=15&access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const resData = await response.json();

    if (!resData?.features) return [];

    return resData.features
      .map((f: any) => {
        const fLat = f.geometry?.coordinates?.[1] || lat;
        const fLng = f.geometry?.coordinates?.[0] || lng;
        const distMeters = f.properties?.distance || 0;

        return {
          id: f.properties?.mapbox_id || f.id || Math.random().toString(),
          name: f.properties?.name || "Local Police Station",
          address: f.properties?.full_address || "Nearby Area",
          dist: distMeters ? `${(distMeters / 1000).toFixed(2)}km` : "Nearby",
          distVal: distMeters / 1000 || 0,
          lat: fLat,
          lng: fLng,
          phone: getOfficialPolicePhone(f.properties?.name || "", "112")
        };
      })
      .sort((a: any, b: any) => a.distVal - b.distVal);
  } catch {
    return [];
  }
};

export const executeMapboxHospitalBackup = async (lat: number, lng: number) => {
  if (!MAPBOX_TOKEN) return [];
  try {
    const url = `https://api.mapbox.com/search/searchbox/v1/category/hospital?proximity=${lng},${lat}&limit=20&access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const resData = await response.json();

    if (!resData?.features) return [];

    return resData.features.map((f: any) => {
      const fLat = f.geometry?.coordinates?.[1] || lat;
      const fLng = f.geometry?.coordinates?.[0] || lng;
      const distMeters = f.properties?.distance || 0;

      return {
        id: f.properties?.mapbox_id || f.id || Math.random().toString(),
        name: f.properties?.name || "Local Hospital",
        address: f.properties?.full_address || "Nearby Area",
        dist: distMeters ? `${(distMeters / 1000).toFixed(1)}km` : "Nearby",
        distVal: distMeters / 1000 || 0,
        lat: fLat,
        lng: fLng,
        phone: "108"
      };
    });
  } catch {
    return [];
  }
};
