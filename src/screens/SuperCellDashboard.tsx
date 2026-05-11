import React, { useState, useEffect } from 'react';
import { Shield, MessageSquare, Radio, Send, X, User, Clock, MapPin, ChevronRight, Activity, Terminal, ShieldAlert } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ProtectorTrack from '../components/supercell/ProtectorTrack';
import { LayoutDashboard, Users, Map as MapIcon, ShieldCheck, Database, MessageCircle } from 'lucide-react';

interface ChatSession {
  userId: string;
  userName: string;
  lastMsg: string;
  timestamp: any;
}

export default function SuperCellDashboard() {
  const [activeView, setActiveView] = useState<'chat' | 'track' | 'dashboard'>('chat');
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const user = auth.currentUser;

  // 🛰️ FETCH ALL ACTIVE CHATS USING COLLECTION GROUP (All 'messages' subcollections)
  useEffect(() => {
    const q = query(collectionGroup(db, 'messages'), orderBy('timestamp', 'desc'), limit(500));
    const unsubscribe = onSnapshot(q, (snap) => {
      const sessions: Record<string, ChatSession> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId && !sessions[data.userId]) {
          sessions[data.userId] = {
            userId: data.userId,
            userName: data.userName || 'Citizen ' + data.userId.slice(0, 4),
            lastMsg: data.text,
            timestamp: data.timestamp
          };
        }
      });
      setActiveSessions(Object.values(sessions));
    });
    return () => unsubscribe();
  }, []);

  // 📡 SELECTED SESSION SYNC (commandhub_chats/{id}/messages)
  useEffect(() => {
    if (!selectedChat) return;
    const q = query(
      collection(db, 'commandhub_chats', selectedChat, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [selectedChat]);

  const handleReply = async () => {
    if (!input.trim() || !selectedChat || !user) return;
    try {
      await addDoc(collection(db, 'commandhub_chats', selectedChat, 'messages'), {
        userId: selectedChat,
        sender: 'supercell',
        text: input,
        timestamp: serverTimestamp(),
        responderName: 'SUPERCELL_COMMANDER',
        sentAt: new Date().toISOString()
      });
      setInput('');
    } catch (e) {
      console.error("SuperCell Reply Failed:", e);
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-white font-sans overflow-hidden">
      {/* 🛠️ TACTICAL MINI-SIDEBAR */}
      <nav className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 bg-[#050506] z-50">
         <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20 mb-4">
            <Shield size={24} strokeWidth={2.5} />
         </div>
         
         <div className="flex flex-col gap-6">
            <NavIcon icon={<LayoutDashboard size={20} />} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} label="Grid" />
            <NavIcon icon={<MessageCircle size={20} />} active={activeView === 'chat'} onClick={() => setActiveView('chat')} label="Comms" />
            <NavIcon icon={<MapIcon size={20} />} active={activeView === 'track'} onClick={() => setActiveView('track')} label="Track" />
            <NavIcon icon={<Users size={20} />} active={false} onClick={() => {}} label="Protectors" />
            <NavIcon icon={<Database size={20} />} active={false} onClick={() => {}} label="Archive" />
         </div>

         <div className="mt-auto">
            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 overflow-hidden">
               <img src={user?.photoURL || ''} alt="" />
            </div>
         </div>
      </nav>

      {activeView === 'track' ? (
        <div className="flex-1">
          <ProtectorTrack />
        </div>
      ) : (
        <>
          {/* 📟 SIDEBAR: MISSION LIST (Only in Chat View) */}
          <aside className="w-80 border-r border-white/5 flex flex-col bg-[#0d0d0f]">
            {/* ... Existing Sidebar Code ... */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-[#1a1a1c] to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] border border-[#2563EB]/30">
                   <Shield size={20} />
                </div>
                <div>
                  <h1 className="text-sm font-black uppercase tracking-[2px] italic">SuperCell</h1>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[3px]">Command Hub</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                  <Activity size={12} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Global Sync Active</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
               <h3 className="px-2 text-[10px] font-black text-gray-500 uppercase tracking-[4px] mb-4">Mission Uplinks</h3>
               {activeSessions.length === 0 ? (
                 <div className="py-20 text-center opacity-20">
                    <Radio size={32} className="mx-auto mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest">Scanning Grid...</p>
                 </div>
               ) : (
                 activeSessions.map((session) => (
                   <button
                     key={session.userId}
                     onClick={() => setSelectedChat(session.userId)}
                     className={cn(
                       "w-full p-4 rounded-2xl border text-left transition-all group relative overflow-hidden",
                       selectedChat === session.userId 
                        ? "bg-[#2563EB] border-[#2563EB] shadow-lg shadow-[#2563EB]/20" 
                        : "bg-white/5 border-white/5 hover:border-white/10"
                     )}
                   >
                     <div className="flex justify-between items-start mb-2">
                        <h4 className={cn("text-[11px] font-black uppercase tracking-tight italic", selectedChat === session.userId ? "text-white" : "text-gray-300")}>
                          {session.userName}
                        </h4>
                        <span className="text-[7px] font-bold text-white/30 uppercase">
                          {session.timestamp ? new Date(session.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'NOW'}
                        </span>
                     </div>
                     <p className={cn("text-[10px] font-medium truncate italic", selectedChat === session.userId ? "text-white/80" : "text-gray-500")}>
                       "{session.lastMsg}"
                     </p>
                   </button>
                 ))
               )}
            </div>
          </aside>

          {/* 📡 MAIN CONSOLE: CHAT GRID */}
          <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#111113] to-[#0A0A0B]">
             {selectedChat ? (
               <div className="flex-1 flex flex-col h-full">
                  <header className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 border border-white/10">
                           <User size={24} />
                        </div>
                        <div>
                           <h2 className="text-lg font-black uppercase italic tracking-tighter text-white leading-none">
                             {activeSessions.find(s => s.userId === selectedChat)?.userName}
                           </h2>
                            <p className="text-[9px] text-[#2563EB] font-black uppercase tracking-[3px] mt-1.5 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full" />
                              Authenticated Session
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedChat(null)} className="p-2 text-gray-500 hover:text-white">
                        <X size={20} />
                     </button>
                  </header>

                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                     {messages.map((msg, idx) => (
                       <div key={idx} className={cn("flex gap-4 max-w-[70%]", msg.sender === 'supercell' ? "ml-auto flex-row-reverse" : "")}>
                          <div className={cn(
                            "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border",
                            msg.sender === 'supercell' ? "bg-[#2563EB]/10 border-[#2563EB]/20 text-[#2563EB]" : "bg-white/5 border-white/10 text-gray-500"
                          )}>
                            {msg.sender === 'supercell' ? <Shield size={18} /> : <User size={18} />}
                          </div>
                          <div className={cn(
                            "p-6 rounded-[32px] text-xs font-medium leading-relaxed shadow-2xl relative group",
                            msg.sender === 'supercell' 
                              ? "bg-[#2563EB] text-white rounded-tr-none shadow-[#2563EB]/10" 
                              : "bg-white/5 text-gray-200 border border-white/5 rounded-tl-none"
                          )}>
                             {msg.text}
                             <div className={cn("text-[7px] font-black uppercase tracking-widest mt-4 opacity-40", msg.sender === 'supercell' ? "text-right" : "")}>
                               {msg.timestamp ? new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString() : 'SYNCING...'}
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>

                  <footer className="p-8 border-t border-white/5 bg-black/60">
                     <div className="flex gap-4 max-w-4xl mx-auto">
                        <input 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                          placeholder="Enter Command Directive..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-white outline-none focus:border-[#2563EB]/50"
                        />
                        <button 
                          onClick={handleReply}
                          disabled={!input.trim()}
                          className="w-16 h-16 bg-[#2563EB] text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-[#2563EB]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                        >
                          <Send size={24} />
                        </button>
                     </div>
                  </footer>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                  <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-white/10 mb-8">
                     <ShieldAlert size={48} />
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-4">Command Terminal Idle</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[5px] max-w-xs leading-relaxed">
                    Select an active mission uplink to synchronize realtime telemetry.
                  </p>
               </div>
             )}
          </main>
        </>
      )}
    </div>
  );
}

function NavIcon({ icon, active, onClick, label }: { icon: any, active: boolean, onClick: () => void, label: string }) {
   return (
      <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={onClick}>
         <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
            active 
               ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
               : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
         )}>
            {icon}
         </div>
         <span className={cn(
            "text-[8px] font-black uppercase tracking-widest transition-all",
            active ? "text-blue-500" : "text-gray-600 opacity-0 group-hover:opacity-100"
         )}>
            {label}
         </span>
      </div>
   )
}
}
