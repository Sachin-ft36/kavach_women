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
      // Check if Contact Picker API is supported
      if (!('contacts' in navigator && 'ContactsManager' in window)) {
        alert("Contact Picker API is not supported in this browser. Please add contacts manually.");
        return;
      }

      const props = ['name', 'tel'];
      const opts = { multiple: true };
      
      // @ts-ignore - Contacts API is experimental
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
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter italic uppercase">{t('guardian_circle')}</h2>
          <p className="text-gray-400 text-[10px] sm:text-sm font-medium uppercase tracking-widest">{t('manage_contacts')}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={importContacts}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-all"
            title={t('import_contacts')}
          >
            <ContactIcon size={20} />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent-blue/20 border border-accent-blue/50 flex items-center justify-center text-accent-blue hover:bg-accent-blue/30 transition-all"
          >
            <UserPlus size={20} />
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
            className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('name')}</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Brother"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-blue outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('relation')}</label>
                <input 
                  type="text" 
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  placeholder="e.g. Family"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-blue outline-none transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('phone')}</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 font-bold text-sm">+91</span>
                <input 
                  type="tel" 
                  value={newPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewPhone(val);
                  }}
                  placeholder="10-digit number"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-14 pr-4 py-3 text-sm focus:border-accent-blue outline-none transition-colors font-mono tracking-wider"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="submit"
                className="flex-1 bg-accent-blue text-white py-3 rounded-xl font-bold text-sm"
              >
                {t('save_guardian')}
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 bg-white/5 border border-white/10 rounded-xl font-bold text-sm"
              >
                {t('cancel')}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {contacts.length === 0 && (
          <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-3xl">
            <AlertCircle className="mx-auto text-gray-600 mb-2" />
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No Guardians Added</p>
          </div>
        )}
        {contacts.map((contact) => (
          <motion.div 
            key={contact.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bento-card p-4 sm:p-5 flex items-center justify-between group h-20"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl flex items-center justify-center text-accent-blue shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="min-w-0">
                <p className="font-black italic uppercase text-sm sm:text-base leading-none truncate mb-1">{contact.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#34C759]">{contact.relation}</span>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <span className="text-[10px] font-mono text-text-dim">{contact.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a 
                href={`tel:${contact.phone}`}
                className="w-11 h-11 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue flex items-center justify-center hover:bg-accent-blue/20 active:scale-90 transition-all"
              >
                <Phone size={18} />
              </a>
              <button 
                onClick={() => removeContact(contact.id)}
                className="w-11 h-11 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600/20 active:scale-90 transition-all opacity-40 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-orange-600/10 border border-orange-600/20 p-6 rounded-3xl">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <AlertCircle size={18} className="text-orange-500" />
          Automatic Alerts
        </h3>
        <p className="text-xs text-orange-200/70 leading-relaxed">
          When SOS is triggered, these contacts will receive an instant SMS with your live location, 
          audio recording link, and current battery status.
        </p>
      </div>
    </div>
  );
}
