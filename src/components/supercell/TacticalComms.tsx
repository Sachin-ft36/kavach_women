import React, { useState, useEffect } from 'react';
import { Shield, MessageSquare, Radio, Send, X, User, Clock, MapPin, ChevronRight, Activity, Terminal, ShieldAlert } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, collectionGroup, doc, getDoc } from 'firebase/firestore';
import { Mail, Phone, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ChatSession {
  userId: string;
  userName: string;
  lastMsg: string;
  timestamp: any;
}

export function TacticalComms() {
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [input, setInput] = useState('');
  const user = auth.currentUser;

  // 🛰️ FETCH ALL ACTIVE CHATS (Direct Session Listener)
  useEffect(() => {
    const q = query(collection(db, 'commandhub_chats'), orderBy('updatedAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      const sessions = snap.docs.map(doc => {
        const data = doc.data();
        return {
          userId: data.userId,
          userName: data.userName || 'Citizen ' + data.userId.slice(0, 4),
          lastMsg: data.lastMsg || 'New Link Established',
          timestamp: data.lastTimestamp || data.updatedAt
        };
      });
      setActiveSessions(sessions);
    });
    return () => unsubscribe();
  }, []);

  // 🛡️ FETCH USER IDENTITY DETAILS
  useEffect(() => {
    if (!selectedChat) {
      setSelectedUserData(null);
      return;
    }
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', selectedChat));
        if (userDoc.exists()) setSelectedUserData(userDoc.data());
      } catch (e) {
        console.error("Identity Fetch Failed:", e);
      }
    };
    fetchUser();
  }, [selectedChat]);

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
    <div className="flex h-full bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm">
      {/* 📟 SIDEBAR: MISSION LIST */}
      <aside className="w-64 border-r border-gray-100 flex flex-col bg-gray-50/30">
        <div className="p-5 border-b border-gray-100">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-4">Active Uplinks</h3>
           <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
              <Activity size={10} className="text-blue-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-600">Sync Active</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
           {activeSessions.length === 0 ? (
             <div className="py-20 text-center opacity-30">
                <Radio size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">Scanning Grid...</p>
             </div>
           ) : (
             activeSessions.map((session) => (
               <button
                 key={session.userId}
                 onClick={() => setSelectedChat(session.userId)}
                 className={cn(
                   "w-full p-3.5 rounded-2xl border text-left transition-all group relative overflow-hidden",
                   selectedChat === session.userId 
                    ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20" 
                    : "bg-white border-gray-100 hover:border-blue-200"
                 )}
               >
                 <div className="flex justify-between items-start mb-1">
                    <h4 className={cn("text-[9px] font-black uppercase tracking-tight", selectedChat === session.userId ? "text-white" : "text-gray-900")}>
                      {session.userName}
                    </h4>
                    <span className={cn("text-[6px] font-bold uppercase", selectedChat === session.userId ? "text-white/50" : "text-gray-400")}>
                      {session.timestamp ? new Date(session.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'NOW'}
                    </span>
                 </div>
                 <p className={cn("text-[8px] font-medium truncate italic", selectedChat === session.userId ? "text-white/80" : "text-gray-500")}>
                   "{session.lastMsg}"
                 </p>
               </button>
             ))
           )}
        </div>
      </aside>

      {/* 📡 MAIN CONSOLE: CHAT GRID */}
      <main className="flex-1 flex flex-col relative bg-white">
         {selectedChat ? (
           <div className="flex-1 flex flex-col h-full">
              <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                       <User size={20} />
                    </div>
                    <div>
                       <h2 className="text-sm font-black uppercase tracking-tight text-gray-900 leading-none">
                         {activeSessions.find(s => s.userId === selectedChat)?.userName}
                       </h2>
                       <div className="flex items-center gap-4 mt-2">
                          <p className="text-[7px] text-blue-600 font-black uppercase tracking-[2px] flex items-center gap-1.5">
                             <span className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                             Active Link
                          </p>
                          {selectedUserData && (
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                               <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400">
                                  <Phone size={10} className="text-blue-500" />
                                  <span className="text-gray-900 uppercase tracking-tight">
                                    {selectedUserData.phoneNumber ? `+91 ${selectedUserData.phoneNumber.slice(-10)}` : 'N/A'}
                                  </span>
                               </div>
                               {/* <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400">
                                  <Fingerprint size={10} className="text-orange-500" />
                                  <span className="text-gray-900 uppercase tracking-tight">
                                    {selectedUserData.aadhar ? `Aadhar: ${selectedUserData.aadhar}` : 'UNLINKED'}
                                  </span>
                               </div> */}
                               <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400">
                                  <Mail size={10} className="text-purple-500" />
                                  <span className="text-gray-900 lowercase tracking-tight">
                                    {selectedUserData.email || 'NO_EMAIL'}
                                  </span>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedChat(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={18} />
                 </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20 custom-scrollbar">
                 {messages.map((msg, idx) => (
                   <div key={idx} className={cn("flex gap-3 max-w-[80%]", msg.sender === 'supercell' ? "ml-auto flex-row-reverse" : "")}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border",
                        msg.sender === 'supercell' ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-400 shadow-sm"
                      )}>
                        {msg.sender === 'supercell' ? <Shield size={14} /> : <User size={14} />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-[24px] text-[11px] font-medium leading-relaxed relative group shadow-sm",
                        msg.sender === 'supercell' 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-white text-gray-900 border border-gray-100 rounded-tl-none"
                      )}>
                         {msg.text}
                         <div className={cn("text-[6px] font-black uppercase tracking-widest mt-2 opacity-40", msg.sender === 'supercell' ? "text-right" : "")}>
                           {msg.timestamp ? new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'PENDING'}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>

              <footer className="p-6 border-t border-gray-100 bg-white">
                 <div className="flex gap-3 max-w-3xl mx-auto">
                    <input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                      placeholder="Enter Command Directive..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-[11px] font-bold text-gray-900 outline-none focus:border-blue-600/30 transition-all shadow-inner"
                    />
                    <button 
                      onClick={handleReply}
                      disabled={!input.trim()}
                      className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                    >
                      <Send size={20} />
                    </button>
                 </div>
              </footer>
           </div>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 rounded-[28px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200 mb-6">
                 <ShieldAlert size={32} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Tactical Comms Idle</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[4px] max-w-xs leading-relaxed">
                Select an active mission uplink to establish command bridge.
              </p>
           </div>
         )}
      </main>
    </div>
  );
}
