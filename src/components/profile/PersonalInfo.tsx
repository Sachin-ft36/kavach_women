import React, { useState } from 'react';
import { ArrowLeft, Camera, Mail, PhoneCall, Calendar, Users, MapPin, Globe, Shield, Lock, ChevronRight, Check, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface PersonalInfoProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  setProfile: (profile: any) => void;
  displayName: string;
  phone: string;
  email: string;
  photoUrl: string;
  memberSinceDate: string;
  genderDisplay: (g: string | null) => string;
}

export default function PersonalInfo({
  isOpen,
  onClose,
  user,
  profile,
  setProfile,
  displayName,
  phone,
  email,
  photoUrl,
  memberSinceDate,
  genderDisplay
}: PersonalInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [editDob, setEditDob] = useState((profile as any)?.dob || '12 May 2003');
  const [editGender, setEditGender] = useState(genderDisplay(profile?.gender || null));
  const [editLocation, setEditLocation] = useState(profile?.address || 'Rewa, Madhya Pradesh, India');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0b0914] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                setIsEditing(false);
              }}
              className="w-10 h-10 flex items-center justify-center text-slate-300 bg-[#121020]/80 border border-[#222135] hover:bg-[#1a1730] rounded-full active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-left">
              <h1 className="text-[17px] font-bold text-white tracking-tight leading-tight">Personal Information</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">Manage your personal details</p>
            </div>
          </div>

          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="border border-white/10 hover:bg-white/5 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all bg-transparent"
            >
              <Pencil size={11} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setEditName(displayName);
                  setEditEmail(email);
                  setEditPhone(phone);
                  setEditDob((profile as any)?.dob || '12 May 2003');
                  setEditLocation(profile?.address || 'Rewa, Madhya Pradesh, India');
                  setIsEditing(false);
                }}
                className="border border-white/10 hover:bg-white/5 px-3 py-1.5 rounded-full text-[10.5px] font-medium text-slate-400 hover:text-white cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const updated = {
                      ...profile,
                      name: editName,
                      email: editEmail,
                      phoneNumber: editPhone,
                      dob: editDob,
                      address: editLocation
                    };
                    setProfile(updated);

                    if (user?.uid) {
                      const { updateDoc, doc } = await import('firebase/firestore');
                      const { db } = await import('../../firebase');
                      await updateDoc(doc(db, 'users', user.uid), {
                        name: editName,
                        email: editEmail,
                        phoneNumber: editPhone,
                        dob: editDob,
                        address: editLocation
                      });
                    }
                    setIsEditing(false);
                    toast.success("Profile details updated successfully!");
                  } catch (e: any) {
                    toast.error("Failed to update: " + e.message);
                  }
                }}
                className="bg-[#6035f5] hover:bg-[#5229db] px-3.5 py-1.5 rounded-full text-[10.5px] font-medium text-white cursor-pointer shadow-md border-none"
              >
                Save
              </button>
            </div>
          )}
        </header>

        {/* Profile Card */}
        <section className="bg-gradient-to-br from-[#1b103c]/90 to-[#0e0724]/95 border border-[#302157] rounded-[24px] p-6 relative overflow-hidden mb-6 text-left shadow-xl min-h-[140px] flex items-center">
          {/* Wavy Animated Background on the Right Corner */}
          <div className="absolute right-[-10px] bottom-[-20px] w-[190px] h-[190px] opacity-[0.28] pointer-events-none z-0">
            <svg className="w-full h-full text-[#a855f7]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
              <style>{`
                @keyframes rippleFlow {
                  0% { stroke-dashoffset: 0; opacity: 0.3; }
                  50% { opacity: 0.9; }
                  100% { stroke-dashoffset: -30; opacity: 0.3; }
                }
                .wave-line {
                  stroke-dasharray: 2.5 4;
                  animation: rippleFlow 4s linear infinite;
                  transform-origin: bottom right;
                }
                .w1 { animation-delay: 0s; }
                .w2 { animation-delay: 0.6s; }
                .w3 { animation-delay: 1.2s; }
                .w4 { animation-delay: 1.8s; }
                .w5 { animation-delay: 2.4s; }
                .w6 { animation-delay: 3s; }
              `}</style>
              {/* Concentric Fingerprint/Ripple Wavy Lines */}
              <path d="M90 100 A10 10 0 0 0 100 90" className="wave-line w1" />
              <path d="M75 100 A25 25 0 0 0 100 75" className="wave-line w2" />
              <path d="M60 100 A40 40 0 0 0 100 60" className="wave-line w3" />
              <path d="M45 100 A55 55 0 0 0 100 45" className="wave-line w4" />
              <path d="M30 100 A70 70 0 0 0 100 30" className="wave-line w5" />
              <path d="M15 100 A85 85 0 0 0 100 15" className="wave-line w6" />
              <path d="M0 100 A100 100 0 0 0 100 0" className="wave-line w1" />
            </svg>
          </div>

          <div className="flex items-center gap-5 relative z-10 w-full">
            <div className="relative shrink-0">
              <div className="relative w-20 h-20 rounded-full p-0.5 bg-gradient-to-br from-[#8b5cf6] to-[#6035f5] shadow-[0_0_24px_rgba(139,92,246,0.4)] flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt={displayName} className="w-full h-full object-cover rounded-full border border-[#0f0a1c]" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#1e173e] flex items-center justify-center text-white font-black text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6.5 h-6.5 rounded-full bg-[#382b6e] border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-[#48378c] transition-colors shadow-md">
                <Camera size={12} />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[19px] font-black text-white leading-tight mb-1.5 truncate tracking-tight">{displayName}</h2>
              <div className="flex items-center gap-1.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/15 px-2.5 py-0.8 rounded-full text-[9px] font-bold w-fit mb-2 shadow-sm">
                <Check size={9} strokeWidth={3} /> Verified Account
              </div>
              <p className="text-[10px] text-slate-400 font-normal flex items-center gap-1.5 mt-1.5">
                <Calendar size={11} className="text-[#8b5cf6]" /> Member since {memberSinceDate}
              </p>
            </div>
          </div>
        </section>

        {/* PERSONAL DETAILS */}
        <section className="mb-5 text-left">
          <h3 className="text-[10.5px] font-extrabold text-[#a855f7] tracking-[0.12em] uppercase mb-2.5 px-1 flex items-center gap-2">
            <span className="w-1 h-3.5 bg-[#a855f7] rounded-full inline-block"></span>
            Personal Details
          </h3>
          
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[20px] divide-y divide-[#1e1d33] overflow-hidden shadow-lg">
            
            {/* Full Name */}
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.015] transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#2e1d5b]/50 flex items-center justify-center text-[#a78bfa] shrink-0 shadow-sm">
                  <Users size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</h4>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      className="bg-[#17152b] border border-white/10 rounded-lg px-2.5 py-1 text-[13px] font-medium text-white mt-1.5 w-full focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/30"
                    />
                  ) : (
                    <p className="text-[14px] font-semibold text-white mt-1 truncate leading-tight">{displayName}</p>
                  )}
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-600 group-hover:text-[#a855f7] transition-colors ml-2" />
            </div>

            {/* Email Address */}
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.015] transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 shadow-sm">
                  <Mail size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</h4>
                  {isEditing ? (
                    <input 
                      type="email" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)} 
                      className="bg-[#17152b] border border-white/10 rounded-lg px-2.5 py-1 text-[13px] font-medium text-white mt-1.5 w-full focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/30"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1 min-w-0">
                      <p className="text-[14px] font-semibold text-white truncate leading-tight">{email}</p>
                      <span className="text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded-full text-[8px] font-bold border border-[#10b981]/25 shrink-0">
                        ✓ Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-600 group-hover:text-[#a855f7] transition-colors ml-2" />
            </div>

            {/* Phone Number */}
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.015] transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#2e1d5b]/50 flex items-center justify-center text-[#a78bfa] shrink-0 shadow-sm">
                  <PhoneCall size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</h4>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editPhone} 
                      onChange={(e) => setEditPhone(e.target.value)} 
                      className="bg-[#17152b] border border-white/10 rounded-lg px-2.5 py-1 text-[13px] font-medium text-white mt-1.5 w-full focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/30"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1 min-w-0">
                      <p className="text-[14px] font-semibold text-white truncate leading-tight">{phone}</p>
                      <span className="text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded-full text-[8px] font-bold border border-[#10b981]/25 shrink-0">
                        ✓ Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-600 group-hover:text-[#a855f7] transition-colors ml-2" />
            </div>

            {/* Date of Birth */}
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.015] transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date of Birth</h4>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editDob} 
                      onChange={(e) => setEditDob(e.target.value)} 
                      className="bg-[#17152b] border border-white/10 rounded-lg px-2.5 py-1 text-[13px] font-medium text-white mt-1.5 w-full focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/30"
                    />
                  ) : (
                    <p className="text-[14px] font-semibold text-white mt-1 truncate leading-tight">{editDob}</p>
                  )}
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-600 group-hover:text-[#a855f7] transition-colors ml-2" />
            </div>

            {/* Gender */}
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.015] transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#2e1d5b]/50 flex items-center justify-center text-[#a78bfa] shrink-0 shadow-sm">
                  <Users size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gender</h4>
                  {isEditing ? (
                    <select 
                      value={editGender} 
                      onChange={(e) => setEditGender(e.target.value)} 
                      className="bg-[#17152b] border border-white/10 rounded-lg px-2.5 py-1 text-[13px] font-medium text-white mt-1.5 w-full focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/30"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-[14px] font-semibold text-white mt-1 truncate leading-tight">{editGender}</p>
                  )}
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-600 group-hover:text-[#a855f7] transition-colors ml-2" />
            </div>

          </div>
        </section>

        {/* ADDITIONAL INFORMATION */}
        <section className="mb-5 text-left">
          <h3 className="text-[10.5px] font-extrabold text-[#a855f7] tracking-[0.12em] uppercase mb-2.5 px-1 flex items-center gap-2">
            <span className="w-1 h-3.5 bg-[#a855f7] rounded-full inline-block"></span>
            Additional Information
          </h3>
          
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[20px] divide-y divide-[#1e1d33] overflow-hidden shadow-lg">
            
            {/* Current Location */}
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.015] transition-colors">
              <div className="flex items-center gap-4 min-w-0 flex-1 pr-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 shadow-sm">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Location</h4>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editLocation} 
                      onChange={(e) => setEditLocation(e.target.value)} 
                      className="bg-[#17152b] border border-white/10 rounded-lg px-2.5 py-1 text-[13px] font-medium text-white mt-1.5 w-full focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/30"
                    />
                  ) : (
                    <p className="text-[14px] font-semibold text-white mt-1 truncate leading-tight">{editLocation}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  if (isEditing) return;
                  toast.info("Updating current GPS location...");
                }}
                className="border border-[#7C4DFF]/40 text-[#a874ff] hover:text-white hover:bg-[#7C4DFF]/15 active:scale-95 transition-all px-3.5 py-1.5 rounded-full text-[10px] font-semibold shrink-0 cursor-pointer bg-transparent"
              >
                Update
              </button>
            </div>

            {/* Preferred Language */}
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.015] transition-colors">
              <div className="flex items-center gap-4 min-w-0 flex-1 pr-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 shadow-sm">
                  <Globe size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preferred Language</h4>
                  <p className="text-[14px] font-semibold text-white mt-1 leading-tight">English</p>
                </div>
              </div>
              <button 
                onClick={() => toast.info("Preferred language selection")}
                className="border border-[#7C4DFF]/40 text-[#a874ff] hover:text-white hover:bg-[#7C4DFF]/15 active:scale-95 transition-all px-3.5 py-1.5 rounded-full text-[10px] font-semibold shrink-0 cursor-pointer bg-transparent"
              >
                Update
              </button>
            </div>

          </div>
        </section>

        {/* Footer Safety Card */}
        <div className="bg-gradient-to-r from-[#051c14] to-[#060e1a] border border-[#064e3b]/40 rounded-[20px] p-5 flex items-center justify-between gap-4 text-left shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-white leading-tight">Your Information is Safe</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                We use industry-standard encryption to protect your personal data.
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Lock size={16} />
          </div>
        </div>

      </div>
    </div>
  );
}
