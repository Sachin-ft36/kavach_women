import React, { useState, useEffect } from 'react';
import { Shield, FileText, Plus, Trash2, ShieldAlert, BookOpen, Edit2, Check, X } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export function WomenSafetyOPS() {
  const [guides, setGuides] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGuide, setNewGuide] = useState({
    title: '',
    content: '',
    type: 'SAFETY',
    priority: 'NORMAL'
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const BOOTCAMP_GUIDES = [
    {
      title: 'Personal Safety & Assessment',
      type: 'SAFETY',
      content: 'Your own safety is paramount. Before intervening, assess the situation from a safe distance. If the perpetrators are armed, in a large group, or highly aggressive, DO NOT engage physically. Observe, record securely, and immediately alert nearby Police (PCR) nodes.',
      priority: 'CRITICAL'
    },
    {
      title: 'First Responder Protocol',
      type: 'TACTICAL',
      content: 'Upon accepting an SOS alert, move towards the location cautiously. Use the "Crowd-Source" approach—try to gather other bystanders or Protectors before confronting the threat. There is safety in numbers.',
      priority: 'CRITICAL'
    },
    {
      title: 'De-escalation & Distraction',
      type: 'TACTICAL',
      content: 'If you must intervene, attempt verbal de-escalation first. Create a distraction (e.g., shouting, shining a flashlight, sounding a loud alarm) to break the perpetrator\'s focus and give the victim a chance to escape.',
      priority: 'NORMAL'
    },
    {
      title: 'Evidence Preservation',
      type: 'TACTICAL',
      content: 'Do not touch or alter the incident area. Use the KAVACH Vault to record tamper-proof photos, videos, or audio from a safe distance. This evidence is geo-tagged and court-admissible.',
      priority: 'CRITICAL'
    },
    {
      title: 'Protector Code of Ethics',
      type: 'ETHICS',
      content: 'Never share the victim\'s identity, location, or photos on social media or outside the KAVACH grid. Maintain absolute confidentiality. Misuse of the platform will result in a permanent ban and strict legal action.',
      priority: 'NORMAL'
    },
    {
      title: 'Kavach App Navigation & Features',
      type: 'SAFETY',
      content: '1. Dashboard: View live SOS alerts.\n2. Accept SOS: Slide to accept; your live location will instantly sync with the Command Center.\n3. Kavach Vault: Tap the camera icon during an active alert to securely record and encrypt evidence directly to the police database.\n4. Escalate: Press \'Escalate to PCR\' if the threat is beyond civilian control.',
      priority: 'NORMAL'
    }
  ];

  useEffect(() => {
    const q = query(collection(db, 'safety_tips'));
    const unsub = onSnapshot(q, (snap) => {
      setGuides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSaveGuide = async () => {
    if (!newGuide.title || !newGuide.content) {
      toast.error('Title and Content are required.');
      return;
    }
    
    try {
      if (editingId) {
        await updateDoc(doc(db, 'safety_tips', editingId), {
          ...newGuide,
          updatedAt: serverTimestamp()
        });
        toast.success('Safety Tip Updated Successfully');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'safety_tips'), {
          ...newGuide,
          timestamp: serverTimestamp()
        });
        toast.success('Safety Tip Broadcasted Successfully');
      }
      setNewGuide({ title: '', content: '', type: 'SAFETY', priority: 'NORMAL' });
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save guide.');
    }
  };

  const handleEditClick = (guide: any) => {
    setNewGuide({
      title: guide.title,
      content: guide.content,
      type: guide.type || 'SAFETY',
      priority: guide.priority || 'NORMAL'
    });
    setEditingId(guide.id);
    setIsAdding(true);
  };

  const loadDefaults = async () => {
    try {
      for (const g of BOOTCAMP_GUIDES) {
        await addDoc(collection(db, 'safety_tips'), {
          ...g,
          timestamp: serverTimestamp()
        });
      }
      toast.success('Default Guides Loaded');
    } catch (e) {
      console.error(e);
      toast.error('Failed to load defaults.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this safety tip?')) return;
    try {
      await deleteDoc(doc(db, 'safety_tips', id));
      toast.success('Safety Tip Removed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete guide.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0F172A] border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
              <BookOpen size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Safety Guidelines</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px]">Broadcast tips to all Protectors</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              if (isAdding) {
                setEditingId(null);
                setNewGuide({ title: '', content: '', type: 'SAFETY', priority: 'NORMAL' });
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[2px] rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {isAdding ? 'Cancel' : <><Plus size={16} /> Add New Tip</>}
          </button>
        </div>

        {isAdding && (
          <div className="mb-8 p-6 bg-white/5 border border-blue-500/30 rounded-[2rem] space-y-4 shadow-lg shadow-blue-900/20">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
               {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
               <span className="text-xs font-black uppercase tracking-widest">{editingId ? 'Edit Safety Tip' : 'Create New Safety Tip'}</span>
            </div>
            <input 
              type="text" 
              placeholder="Tip Title (e.g. Hostage Situation Protocol)" 
              value={newGuide.title}
              onChange={(e) => setNewGuide({...newGuide, title: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-blue-500/50"
            />
            <textarea 
              placeholder="Detailed guidelines..." 
              value={newGuide.content}
              onChange={(e) => setNewGuide({...newGuide, content: e.target.value})}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none focus:border-blue-500/50 resize-none"
            />
            <div className="flex gap-4">
              <select 
                value={newGuide.type}
                onChange={(e) => setNewGuide({...newGuide, type: e.target.value})}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-widest outline-none flex-1"
              >
                <option value="SAFETY">General Safety</option>
                <option value="TACTICAL">Tactical Response</option>
                <option value="ETHICS">Code of Ethics</option>
              </select>
              <select 
                value={newGuide.priority}
                onChange={(e) => setNewGuide({...newGuide, priority: e.target.value})}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-widest outline-none flex-1"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="CRITICAL">Critical Alert</option>
              </select>
              <button 
                onClick={handleSaveGuide}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700"
              >
                {editingId ? 'Save Changes' : 'Broadcast'}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
          {guides.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-70">
               <ShieldAlert size={48} className="text-gray-500 mb-4" />
               <p className="text-xs font-black uppercase tracking-[3px] text-gray-500 mb-6">No Custom Guidelines Active</p>
               <button 
                 onClick={loadDefaults}
                 className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[2px] rounded-xl border border-white/10 transition-colors"
               >
                 Load Default Guidelines
               </button>
            </div>
          ) : (
            guides.map(guide => (
              <div key={guide.id} className="p-6 bg-black/20 border border-white/5 rounded-2xl flex justify-between items-start group hover:border-white/10 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-bold text-lg">{guide.title}</h3>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${guide.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
                      {guide.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-3xl whitespace-pre-wrap">{guide.content}</p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditClick(guide)}
                    className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 flex items-center justify-center transition-all"
                    title="Edit Tip"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(guide.id)}
                    className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all"
                    title="Delete Tip"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
