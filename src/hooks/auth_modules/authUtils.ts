export const MASTER_PASSWORD = "Singhsachin@#0012";

export const detectAdminTier = (email: string): 'NATIONAL' | 'STATE' | 'DISTRICT' | 'PROTECTOR' | 'CITIZEN' => {
  const e = email.toLowerCase();
  if (e === 'admin') return 'NATIONAL';
  if (e.includes('adminsachin') && e.split('.').length >= 3) {
    const parts = e.split('@')[0].split('.');
    if (parts.length >= 3) return 'DISTRICT';
    return 'STATE';
  }
  if (e.includes('adminsachin')) return 'STATE';
  if (e.includes('protector')) return 'PROTECTOR';
  return 'CITIZEN';
};
