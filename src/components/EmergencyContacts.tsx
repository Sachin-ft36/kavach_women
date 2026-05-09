import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Phone, ShieldCheck, AlertCircle, Contact as ContactIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

import { collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

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

  useEffect(() => {
    if (!auth.currentUser) return;

    const guardiansRef = collection(db, 'users', auth.currentUser.uid, 'guardians');
    const unsubscribe = onSnapshot(guardiansRef, (snapshot) => {
      const gList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      setContacts(gList);
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

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'guardians'), {
        name: newName,
        phone: `+91${cleanedPhone}`,
        relation: newRelation || 'Friend',
        createdAt: serverTimestamp()
      });
      setNewName('');
      setNewPhone('');
      setNewRelation('');
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding guardian:", err);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Guardian Circle</h2>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mt-1">Manage Emergency Contacts</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={importContacts}
            className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
          >
            <ContactIcon size={22} />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white hover:bg-[#1D4ED8] transition-all shadow-lg shadow-[#2563EB]/20"
          >
            <UserPlus size={22} />
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
            className="bg-gray-50 border border-[#E5E7EB] rounded-[32px] p-8 space-y-5 overflow-hidden shadow-inner"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Guardian Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-white border border-[#E5E7EB] rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB] outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Relation</label>
                <input 
                  type="text" 
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  placeholder="e.g. Brother, Family"
                  className="w-full bg-white border border-[#E5E7EB] rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB] outline-none transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Mobile Number</label>
              <div className="relative flex items-center">
                <span className="absolute left-5 text-gray-400 font-bold text-sm">+91</span>
                <input 
                  type="tel" 
                  value={newPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewPhone(val);
                  }}
                  placeholder="10-digit number"
                  className="w-full bg-white border border-[#E5E7EB] rounded-2xl pl-16 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB] outline-none transition-all shadow-sm tracking-wider"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="submit"
                className="flex-1 bg-[#2563EB] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-[#2563EB]/20 hover:bg-[#1D4ED8] transition-all"
              >
                Save Guardian
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-8 bg-white border border-[#E5E7EB] rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {contacts.length === 0 && !loading && (
          <div className="text-center py-16 bg-white border border-dashed border-[#E5E7EB] rounded-[32px]">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertCircle className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No Guardians Configured</p>
            <p className="text-xs text-gray-300 mt-1">Add contacts to enable automatic SOS alerts.</p>
          </div>
        )}
        {contacts.map((contact) => (
          <motion.div 
            key={contact.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E5E7EB] rounded-[28px] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-14 h-14 bg-[#2563EB]/5 border border-[#2563EB]/10 rounded-2xl flex items-center justify-center text-[#2563EB] shrink-0 shadow-sm">
                <ShieldCheck size={28} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-base leading-tight truncate">{contact.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full">{contact.relation}</span>
                  <span className="text-xs font-bold text-gray-400 font-mono tracking-tight">{contact.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a 
                href={`tel:${contact.phone}`}
                className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center hover:bg-[#2563EB] hover:text-white active:scale-90 transition-all shadow-sm"
              >
                <Phone size={20} />
              </a>
              <button 
                onClick={() => removeContact(contact.id)}
                className="w-12 h-12 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] flex items-center justify-center hover:bg-[#DC2626] hover:text-white active:scale-90 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
           <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Automatic Alerts Protocol</h3>
          <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
            When SOS is triggered, these contacts will receive an instant encrypted SMS with your live GPS location, 
            real-time audio recording link, and hardware status reports.
          </p>
        </div>
      </div>
    </div>
  );
}
