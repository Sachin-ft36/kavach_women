export async function generateSHA256(data: string) {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Dynamic Geographic Case ID Nomenclature Generator
export const generateCaseNumber = (stateName: string = 'MP', districtName: string = 'REWA') => {
  const year = new Date().getFullYear();
  const stateCode = stateName.slice(0, 4).toUpperCase();
  const districtCode = districtName.slice(0, 4).toUpperCase();
  const randomId = Math.floor(1000 + Math.random() * 9000);
  return `KV-${year}-${districtCode}-${randomId}`;
};
