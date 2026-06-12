import React from 'react';
import { Shield, MapPin, FileText, Radio, Siren, Clipboard, ShieldAlert, Activity, Users } from 'lucide-react';

export const citizenFeatures = [
  {
    icon: <span className="font-black text-[7px] tracking-tighter">SOS</span>,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "SOS",
    title2: "Alert"
  },
  {
    icon: <MapPin size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Live",
    title2: "Tracking"
  },
  {
    icon: <Shield size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Guardian",
    title2: "Network"
  },
  {
    icon: <FileText size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Evidence",
    title2: "Vault"
  }
];

export const pcrFeatures = [
  {
    icon: <MapPin size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Live",
    title2: "Maps"
  },
  {
    icon: <Radio size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Auto",
    title2: "Dispatch"
  },
  {
    icon: <Siren size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Emergency",
    title2: "Routing"
  },
  {
    icon: <Clipboard size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Patrol",
    title2: "Management"
  }
];

export const protectorFeatures = [
  {
    icon: <ShieldAlert size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "SOS",
    title2: "Alerts"
  },
  {
    icon: <Activity size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Active",
    title2: "Escort"
  },
  {
    icon: <MapPin size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Duty",
    title2: "Grid"
  },
  {
    icon: <Users size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Community",
    title2: "Network"
  }
];
