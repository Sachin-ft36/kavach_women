import React from 'react';
import { Phone, Calendar, Heart, Shield, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function DetailedInfoGrid({
  isEditing,
  phone,
  setPhone,
  dob,
  setDob,
  bloodGroup,
  setBloodGroup,
  gender,
  handleGenderChange,
  role,
  setRole
}: any) {
  return (
    <div className="space-y-3">
      {/* Row 1: Phone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Phone size={12} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Mobile Number</span>
        </div>
        {isEditing ? (
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-left font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto text-sm"
            placeholder="10-digit number"
          />
        ) : (
          <span className="font-bold text-slate-900 text-sm w-full sm:w-auto text-left">{phone ? `+91 ${phone}` : "Not Provided"}</span>
        )}
      </div>


      {/* Row 3: Gender */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gender</span>
        {isEditing ? (
          <div className="flex gap-1.5 w-full sm:w-auto">
            {(['female', 'male'] as const).map(g => (
              <button
                key={g}
                onClick={() => handleGenderChange(g)}
                className={cn(
                  "flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold uppercase border transition-all",
                  gender === g 
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        ) : (
          <span className="font-bold text-slate-900 uppercase bg-slate-100 px-3 py-1.5 rounded-md text-xs w-full sm:w-auto text-left">
            {gender || "Not Specified"}
          </span>
        )}
      </div>

      {/* Row 4: Assigned Role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Shield size={12} /> Safety Role
        </span>
        {isEditing ? (
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto justify-end sm:justify-end justify-start">
            {(['citizen', 'protector', 'guardian'] as const).map(r => {
              const allowed = r !== 'citizen' || gender === 'female';
              return (
                <button
                  key={r}
                  disabled={!allowed}
                  onClick={() => setRole(r)}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[9px] font-bold uppercase border transition-all",
                    role === r 
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                    !allowed && "opacity-40 cursor-not-allowed hover:bg-white"
                  )}
                >
                  {r === 'citizen' ? "Citizen" : r === 'protector' ? "Rakshak" : "Family Guardian"}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="font-bold text-blue-700 uppercase bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 text-xs tracking-tight w-full sm:w-auto text-left">
            {role === 'citizen' ? "Citizen (Women Shield)" : role === 'protector' ? "Civic Protector" : role === 'guardian' ? "Family Guardian" : "Not Selected"}
          </span>
        )}
      </div>
    </div>
  );
}

export function ConsentSection({ tosChecked, setTosChecked }: any) {
  return (
    <div className="space-y-2">
      <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1">
        Final Authorization
      </h4>
      
      <div 
        onClick={() => setTosChecked((p: any) => ({ ...p, terms: !p.terms }))}
        className={cn(
          "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
          tosChecked.terms ? "bg-blue-50/50 border-blue-500/40 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
        )}
      >
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
          tosChecked.terms ? "bg-blue-600 border-blue-600" : "border-slate-300"
        )}>
          {tosChecked.terms && <Check size={12} className="text-white stroke-[2px]" />}
        </div>
        <p className={cn(
          "text-[11px] leading-tight transition-colors",
          tosChecked.terms ? "text-slate-800 font-medium" : "text-slate-500"
        )}>
          I authorize KAVACH to run persistent background services for safety monitoring.
        </p>
      </div>

      <div 
        onClick={() => setTosChecked((p: any) => ({ ...p, permissions: !p.permissions }))}
        className={cn(
          "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
          tosChecked.permissions ? "bg-blue-50/50 border-blue-500/40 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
        )}
      >
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
          tosChecked.permissions ? "bg-blue-600 border-blue-600" : "border-slate-300"
        )}>
          {tosChecked.permissions && <Check size={12} className="text-white stroke-[2px]" />}
        </div>
        <p className={cn(
          "text-[11px] leading-tight transition-colors",
          tosChecked.permissions ? "text-slate-800 font-medium" : "text-slate-500"
        )}>
          I consent to secure preservation of telemetry and evidence for law enforcement.
        </p>
      </div>
    </div>
  );
}
