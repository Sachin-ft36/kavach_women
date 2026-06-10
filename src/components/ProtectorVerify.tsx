import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, UserCheck, AlertTriangle, UserX, Search, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';

export default function ProtectorVerify() {
  const { t } = useLanguage();
  const isAdmin = auth.currentUser?.email === 'singh.sachin16559@gmail.com';
  const [protectors, setProtectors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'pending' | 'verified'>('pending');

  useEffect(() => {
    if (!isAdmin) return;

    // We query broadly and filter locally to avoid complex index requirements initially
    const userQuery = query(
      collection(db, 'users'),
      where('role', '==', 'protector')
    );

    const unsubscribe = onSnapshot(userQuery, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProtectors(pList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const logMissionAction = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'mission_ledger'), {
        adminEmail: auth.currentUser?.email,
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn("Ledger Sync Failed:", err);
    }
  };

  const handleVerify = async (uid: string, name: string) => {
    if (!confirm(`Are you sure you want to OFFICIALY VERIFY Rakshak: ${name}?`)) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isVerified: true,
        verifiedAt: serverTimestamp(),
        verifiedBy: auth.currentUser?.email
      });
      logMissionAction('PROTECTOR_VERIFIED', `Rakshak ${name} (${uid}) was officially verified by Command.`);
    } catch (e) {
      console.error("Verification error:", e);
      alert("Failed to verify Rakshak. Please try again.");
    }
  };

  const handleRevoke = async (uid: string, name: string) => {
    if (!confirm(`CAUTION: Are you sure you want to REVOKE verification for Rakshak: ${name}?`)) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isVerified: false,
        revokedAt: serverTimestamp(),
        revokedBy: auth.currentUser?.email
      });
      logMissionAction('VERIFICATION_REVOKED', `Rakshak ${name} (${uid}) verification revoked by Command.`);
    } catch (e) {
      console.error("Revoke error:", e);
      alert("Failed to revoke verification. Please try again.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-xl rounded-3xl border border-accent-red/20 min-h-[60vh]">
        <AlertTriangle size={40} className="text-accent-red mb-4" />
        <h2 className="text-2xl font-black uppercase text-white tracking-widest">Access Denied</h2>
      </div>
    );
  }

  const filteredProtectors = protectors.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phoneNumber?.includes(searchTerm);
    const matchesFilter = filter === 'pending' ? !p.isVerified : p.isVerified;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black border-l-4 border-l-accent-blue p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent-blue/10 border border-accent-blue/30 rounded-2xl flex items-center justify-center text-accent-blue shadow-[0_0_20px_rgba(0,122,255,0.2)]">
              <UserCheck size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1 text-white">Rakshak Verification</h1>
              <p className="text-[10px] text-accent-blue font-mono font-bold uppercase tracking-[4px]">Central Command Node</p>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'pending' ? 'bg-accent-blue text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              <ShieldAlert size={14} /> Pending
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[8px]">{protectors.filter(p => !p.isVerified).length}</span>
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'verified' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              <ShieldCheck size={14} /> Verified
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[8px]">{protectors.filter(p => p.isVerified).length}</span>
            </button>
          </div>
        </div>

        {/* AI AUTO VERIFICATION SYSTEM - Commented out until API integration is complete */}
        {/* <div className="relative z-10 mt-6 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Database size={16} className="text-accent-blue" />
              UIDAI & CCTNS Auto-Clearance
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Cross-check pending applications against National Crime Records</p>
          </div>
          <button
            onClick={async () => {
              const pending = protectors.filter(p => !p.isVerified && p.aadhaar);
              if (pending.length === 0) return alert("No pending applications with Aadhaar found.");
              if (!confirm(`Running AI scan on ${pending.length} applications across Police & UIDAI databases. Continue?`)) return;

              // Simulate API check
              alert("Initiating Database Sync... Cross-referencing Police Records.");

              const batchPromises = pending.map(p =>
                updateDoc(doc(db, 'users', p.id), {
                  isVerified: true,
                  verifiedAt: serverTimestamp(),
                  verifiedBy: 'AI_UIDAI_CCTNS_SYSTEM'
                })
              );

              await Promise.all(batchPromises);
              logMissionAction('AI_BATCH_VERIFY', `${pending.length} Rakshaks auto-verified via UIDAI/CCTNS clearance.`);
              alert(`Mission Success: ${pending.length} Protector Badges issued automatically.`);
            }}
            className="px-6 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all hover:bg-blue-600 hover:text-white active:scale-95 whitespace-nowrap"
          >
            Run Auto-Clearance Scan
          </button>
        </div> */}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="SEARCH RAKSHAK BY NAME, EMAIL, OR PHONE..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-xs sm:text-sm font-black uppercase tracking-widest text-white focus:border-accent-blue/50 outline-none transition-all shadow-xl placeholder:text-gray-600"
        />
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredProtectors.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-sm"
            >
              <Database size={48} className="mx-auto text-gray-700 mb-4 opacity-50" />
              <p className="text-gray-500 text-xs font-black uppercase tracking-[3px]">No records found</p>
            </motion.div>
          )}

          {filteredProtectors.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className={`bento-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-l-4 ${p.isVerified ? 'border-l-green-500' : 'border-l-orange-500'}`}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${p.isVerified ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
                  {p.isVerified ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black italic uppercase text-lg sm:text-xl truncate text-white leading-tight mb-1">{p.name || 'Unnamed Sentinel'}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] font-mono text-gray-400">
                    <span className="truncate">{p.email}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-white tracking-widest">{p.phoneNumber || 'NO PHONE'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 border-t border-white/5 sm:border-t-0 pt-4 sm:pt-0">
                {!p.isVerified ? (
                  <button
                    onClick={() => handleVerify(p.id, p.name || 'Unknown')}
                    className="flex-1 sm:flex-none px-6 py-4 bg-accent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-blue-600 transition-colors shadow-[0_0_20px_rgba(0,122,255,0.3)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <UserCheck size={16} /> Assign Badge
                  </button>
                ) : (
                  <button
                    onClick={() => handleRevoke(p.id, p.name || 'Unknown')}
                    className="flex-1 sm:flex-none px-6 py-4 bg-white/5 text-gray-400 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <UserX size={16} /> Revoke Status
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
