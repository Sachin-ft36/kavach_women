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

export const guardianFeatures = [
  {
    icon: <MapPin size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Live",
    title2: "Tracking"
  },
  {
    icon: <Radio size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Remote",
    title2: "Triggers"
  },
  {
    icon: <Siren size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Evidence",
    title2: "Feeds"
  },
  {
    icon: <Users size={11} className="stroke-[2.5]" />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title1: "Mobilize",
    title2: "Protectors"
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
