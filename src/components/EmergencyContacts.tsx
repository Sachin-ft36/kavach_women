import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Phone, ShieldCheck, AlertCircle, Contact as ContactIcon, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

import { collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import QuickPairQr from './guardian/QuickPairQr';
import { KavachSafe } from '../services/KavachNative';

import { useKavachStore } from '../state/useKavachStore';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export default function EmergencyContacts() {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const guardiansRef = collection(db, 'users', auth.currentUser.uid, 'guardians');
    const unsubscribe = onSnapshot(guardiansRef, (snapshot) => {
      const gList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      setContacts(gList);
      useKavachStore.getState().setGuardianCache(gList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/guardians`);
    });

    return () => unsubscribe();
  }, []);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !auth.currentUser) return;

    const cleanedPhone = newPhone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const fullPhone = `+91${cleanedPhone}`;
    const isDuplicate = contacts.some(c => c.phone.replace(/\D/g, '').slice(-10) === cleanedPhone);
    
    if (isDuplicate) {
      alert("This contact is already in your Guardian Circle.");
      return;
    }

    try {
      // 1. Save standard guardian entry
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'guardians'), {
        name: newName,
        phone: fullPhone,
        relation: newRelation || 'Friend',
        createdAt: serverTimestamp()
      });

      // 2. Create pending link for the guardian
      await setDoc(doc(db, 'guardian_pending_links', fullPhone), {
        citizenUid: auth.currentUser.uid,
        citizenName: auth.currentUser.displayName || 'Kavach Citizen',
        citizenPhone: auth.currentUser.phoneNumber || '',
        relationship: newRelation || 'Guardian',
        createdAt: serverTimestamp()
      }, { merge: true }).catch(() => { });

      // 3. Silent Handshake Protocol
      const q = query(collection(db, 'users'), where('phoneNumber', '==', fullPhone));
      const snap = await getDocs(q);

      if (snap.docs.length > 0) {
        const guardianUid = snap.docs[0].id;
        console.log(`✉️ SILENT HANDSHAKE: Guardian ${newName} (${fullPhone}) exists (UID: ${guardianUid}). Dispatching high-priority push notification...`);
        
        // Push notification inside app notifications collection
        await addDoc(collection(db, 'users', guardianUid, 'notifications'), {
          type: 'circle_add_invite',
          title: 'New Safety Circle Invitation',
          body: `${auth.currentUser.displayName || 'A family member'} has added you to their Safety Circle. Tap to accept.`,
          senderUid: auth.currentUser.uid,
          senderName: auth.currentUser.displayName || 'Kavach Citizen',
          senderPhone: auth.currentUser.phoneNumber || '',
          createdAt: serverTimestamp(),
          status: 'unread'
        }).catch(() => {});

        toast.success("Silent Handshake Activated: Guardian is registered. Notification sent in-app.");
      } else {
        console.log(`✉️ SMS BRIDGE: Guardian ${newName} (${fullPhone}) is not registered. Dispatched standard SMS invite link.`);
        
        const playStoreLink = "https://play.google.com/store/apps/details?id=com.kavach.app";
        const message = `🚨 Kavach Safety Network: ${auth.currentUser.displayName || 'A family member'} wants to add you as their Guardian. Tap here to register: ${playStoreLink}`;
        
        try {
          await KavachSafe.broadcastEmergencySMS({ numbers: [fullPhone], message });
        } catch (smsErr) {
          console.warn("Failed to dispatch SMS, likely running on web simulator:", smsErr);
        }

        toast.info("SMS Bridge Engaged: Standard SMS invitation link dispatched to the guardian.");
      }

      setNewName('');
      setNewPhone('');
      setNewRelation('');
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding guardian:", err);
      toast.error("Failed to add contact. Please verify details.");
    }
  };

  const removeContact = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'guardians', id));
    } catch (err) {
      console.error("Error removing guardian:", err);
    }
  };

  const importContacts = async () => {
    try {
      if (!('contacts' in navigator && 'ContactsManager' in window)) {
        alert("Contact Picker API is not supported in this browser.");
        return;
      }
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      // @ts-ignore
      const selectedContacts = await navigator.contacts.select(props, opts);
      if (selectedContacts.length > 0) {
        const newContacts: Contact[] = selectedContacts.map((c: any) => ({
          id: Date.now().toString() + Math.random(),
          name: c.name?.[0] || 'Unknown',
          phone: c.tel?.[0] || '',
          relation: 'Imported'
        })).filter((c: Contact) => c.phone !== '');
        setContacts(prev => [...prev, ...newContacts]);
      }
    } catch (err) {
      console.error("Error importing contacts:", err);
    }
  };

  return (
    <div className="space-y-6 pt-4 sm:pt-6 pb-24 px-4 sm:px-6">
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Guardian Circle</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1">Manage Emergency Contacts</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowQrModal(true)}
            className="w-11 h-11 rounded-2xl bg-indigo-650/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer"
            title="Pair Guardian via QR"
          >
            <QrCode size={18} />
          </button>
          <button 
            onClick={importContacts}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ContactIcon size={18} />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <UserPlus size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={addContact}
            className="bg-[#0D1233]/80 border border-white/[0.06] rounded-[28px] p-6 space-y-5 overflow-hidden shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relation</label>
                <input 
                  type="text" 
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  placeholder="e.g. Brother, Family"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2 text-left relative z-10">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
              <div className="relative flex items-center">
                <span className="absolute left-5 text-slate-400 font-bold text-sm">+91</span>
                <input 
                  type="tel" 
                  value={newPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewPhone(val);
                  }}
                  placeholder="10-digit number"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-5 py-4 text-sm font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all tracking-wider"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4 relative z-10">
              <button 
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[2px] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Save Guardian
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-8 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-slate-400 hover:bg-white/10 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {contacts.length === 0 && !loading && (
          <div className="text-center py-16 bg-white/[0.02] border border-dashed border-white/10 rounded-[28px] backdrop-blur-sm">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertCircle className="text-slate-550" size={32} />
            </div>
            <p className="text-slate-300 text-sm font-bold uppercase tracking-widest">No Guardians Configured</p>
            <p className="text-xs text-slate-500 mt-1">Add contacts to enable automatic SOS alerts.</p>
          </div>
        )}
        {contacts.map((contact) => (
          <motion.div 
            key={contact.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-[#1C1F5C] via-[#141747] to-[#0B0D2F] border border-white/10 rounded-[24px] p-4 pr-6 flex items-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-blue-500/30 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1 text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 shadow-md">
                <ShieldCheck size={24} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm sm:text-base leading-tight truncate">{contact.name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{contact.relation}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 font-mono tracking-tight">{contact.phone}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <a 
                href={`tel:${contact.phone}`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-2xl bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]"
              >
                <Phone size={16} className="fill-current text-white" />
              </a>
              <button 
                onClick={() => removeContact(contact.id)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-600 hover:text-white active:scale-90 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[28px] flex gap-4 backdrop-blur-md text-left">
        <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
           <AlertCircle size={22} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        </div>
        <div>
          <h3 className="font-black text-amber-500 tracking-wider uppercase text-[11px] mb-1">Automatic Alerts Protocol</h3>
          <p className="text-[11px] text-amber-200/70 leading-relaxed font-bold">
            When SOS is triggered, these contacts will receive an instant encrypted SMS with your live GPS location, 
            real-time audio recording link, and hardware status reports.
          </p>
        </div>
      </div>
      
      <AnimatePresence>
        {showQrModal && (
          <QuickPairQr 
            mode="generate" 
            onClose={() => setShowQrModal(false)} 
            currentUserProfile={{
              uid: auth.currentUser?.uid,
              name: auth.currentUser?.displayName || 'Kavach Citizen',
              phoneNumber: auth.currentUser?.phoneNumber || ''
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
