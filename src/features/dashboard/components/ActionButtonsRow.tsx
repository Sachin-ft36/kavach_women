import React from "react";
import {
  MapPin,
  ShieldCheck,
  Bell,
  MessageCircle,
} from "lucide-react";

const actions = [
  {
    title: "Live\nLocation",
    subtitle: "Tracking",
    icon: MapPin,
    color: "from-violet-500 to-fuchsia-500",
    glow: "shadow-violet-500/30",
  },
  {
    title: "Protection\nScore",
    subtitle: "Secure",
    icon: ShieldCheck,
    color: "from-cyan-500 to-sky-500",
    glow: "shadow-cyan-500/30",
  },
  {
    title: "Alerts",
    subtitle: "Realtime",
    icon: Bell,
    color: "from-rose-500 to-orange-500",
    glow: "shadow-rose-500/30",
  },
  {
    title: "Messages",
    subtitle: "Connected",
    icon: MessageCircle,
    color: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/30",
  },
];

export default function ActionButtonsRow() {
  return (
    <div className="grid grid-cols-4 gap-3 w-full">
      {actions.map((item, index) => {
        const Icon = item.icon;

        return (
          <button
            key={index}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-3 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] active:scale-95"
          >
            {/* Glow */}
            <div
              className={`absolute -top-10 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-gradient-to-r ${item.color} opacity-20 blur-3xl group-hover:opacity-40 transition`}
            />

            {/* Gradient Ring */}
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${item.color} p-[1.5px] shadow-xl ${item.glow}`}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0f1120]/90 backdrop-blur-xl">
                <Icon
                  size={22}
                  strokeWidth={2.3}
                  className="text-white"
                />
              </div>
            </div>

            {/* Title */}
            <h3 className="mt-3 whitespace-pre-line text-center text-[11px] font-semibold leading-tight tracking-wide text-white">
              {item.title}
            </h3>

            {/* Subtitle */}
            <p className="mt-1 text-[9px] text-white/45 font-medium">
              {item.subtitle}
            </p>

            {/* Bottom Accent */}
            <div
              className={`mt-3 h-1 w-full rounded-full bg-gradient-to-r ${item.color} opacity-70`}
            />

            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />
          </button>
        );
      })}
    </div>
  );
}
