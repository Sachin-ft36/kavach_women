import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Trash2, ShieldAlert, RefreshCcw } from 'lucide-react';
import { auth, db, logTelemetryEvent } from '../../firebase';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, updateDoc, arrayRemove } from 'firebase/firestore';
import { toast } from 'sonner';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void; // Triggered after successful deletion
}

export default function DeleteAccountModal({ isOpen, onClose, onLogout }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'WARNING' | 'REAUTH'>('WARNING');

  if (!isOpen) return null;

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      // Re-authenticate user before deletion
      if (user.email && password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // 1. Soft-delete pattern: Set accountStatus = pending_deletion
      // This is safer than client-side cascading deletes. A Firebase Cloud Function 
      // Track deletion for beta metrics
      logTelemetryEvent('account_deleted');

      // Final local wipe the Auth record, user doc, and references in the background.
      const uid = user.uid;
      await updateDoc(doc(db, 'users', uid), {
        accountStatus: 'pending_deletion',
        deletedAt: new Date().toISOString()
      });

      // 2. Sign out the user immediately
      await auth.signOut();

      toast.success('Account scheduled for deletion. Data will be purged shortly.');
      onLogout();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login' || error.code === 'auth/wrong-password') {
        toast.error('Authentication failed. Please verify your password.');
      } else {
        toast.error('Failed to delete account. Try logging out and back in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert size={16} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-red-900 tracking-tight">Delete Account</h2>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Permanent Action</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {step === 'WARNING' ? (
              <motion.div
                key="warning"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                  <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 font-medium leading-relaxed">
                    This action will permanently delete your account, wipe all personal telemetry data, remove you from Family Circles, and destroy all un-submitted Evidence Vault items. <br/><br/><b>This cannot be undone.</b>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={onClose}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setStep('REAUTH')}
                    className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} /> Proceed
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reauth"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <p className="text-xs text-slate-600 font-medium">
                    Please re-enter your password to confirm account deletion. If you registered via Google, you may be prompted to sign in again.
                  </p>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 pl-0.5">Account Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-medium outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setStep('WARNING')}
                      disabled={loading}
                      className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !password}
                      className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      {loading ? 'DELETING...' : 'DELETE'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
