import { useState, useMemo } from 'react';

export function useKavachDirectoryLogic(womenUsers: any[], protectors: any[], selectedState: string) {
  const [activeTab, setActiveTab] = useState<'UNIVERSAL' | 'WOMEN' | 'PROTECTORS'>('UNIVERSAL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<any>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const aggregateIdentities = (usersList: any[], protectorsList: any[]) => {
    const registry: Record<string, any> = {};

    const processUser = (user: any, defaultRole: string) => {
      if (!user) return;
      
      const aadharNum = user.aadhaar || user.aadhar;
      const phoneNum = user.phoneNumber || user.phone;
      const idKey = user.id || user.uid || aadharNum || phoneNum || user.email || Math.random().toString();
      
      const roleStr = user.role || defaultRole;
      const formattedRole = roleStr.toUpperCase();

      if (registry[idKey]) {
        const existing = registry[idKey];
        const existingRoles = existing.role ? existing.role.split(' / ') : [];
        if (!existingRoles.includes(formattedRole)) {
          existingRoles.push(formattedRole);
        }
        existing.role = existingRoles.join(' / ');
        
        if (user.isVerified || user.verified) {
          existing.isVerified = true;
        }
        if (user.protectorVetting) {
          existing.protectorVetting = { ...existing.protectorVetting, ...user.protectorVetting };
        }
      } else {
        registry[idKey] = {
          ...user,
          role: formattedRole
        };
      }
    };

    usersList.forEach(u => processUser(u, 'CITIZEN'));
    protectorsList.forEach(p => processUser(p, 'PROTECTOR'));

    return Object.values(registry);
  };

  const allMergedIdentities = useMemo(() => aggregateIdentities(womenUsers, protectors), [womenUsers, protectors]);
  const mergedWomenUsers = useMemo(() => allMergedIdentities.filter(u => u.gender?.toUpperCase() === 'FEMALE' || u.role.includes('CITIZEN')), [allMergedIdentities]);
  const mergedProtectors = useMemo(() => allMergedIdentities.filter(u => u.role.includes('PROTECTOR')), [allMergedIdentities]);

  const filteredData = useMemo(() => {
    const baseData = activeTab === 'UNIVERSAL' ? allMergedIdentities : activeTab === 'WOMEN' ? mergedWomenUsers : mergedProtectors;
    return baseData.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.aadhaar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.aadhar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, allMergedIdentities, mergedWomenUsers, mergedProtectors, searchTerm]);

  return {
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    selectedUserForAudit, setSelectedUserForAudit,
    isAuditModalOpen, setIsAuditModalOpen,
    allMergedIdentities, mergedWomenUsers, mergedProtectors,
    filteredData
  };
}
