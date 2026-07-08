import React from "react";
import { Shield } from "lucide-react";

export default function PhoneMockup() {
  return (
    <div
      className="
      relative
      w-[185px]
      h-[330px]
      rotate-[-10deg]
      "
    >
      {/* Glow */}
      <div className="absolute inset-0 rounded-[42px] bg-violet-600/20 blur-[50px]" />

      {/* Shadow */}
      <div className="absolute inset-x-6 -bottom-6 h-8 rounded-full bg-black/50 blur-xl" />

      {/* Phone */}
      <div
        className="
        relative
        h-full
        rounded-[36px]
        bg-[#090914]
        border
        border-[#3b2765]
        overflow-hidden
        shadow-[0_30px_70px_rgba(0,0,0,.6)]
      "
      >
        {/* Frame Highlight */}
        <div
          className="
          absolute
          inset-0
          rounded-[36px]
          border
          border-white/5
          pointer-events-none
        "
        />

        {/* Reflection */}
        <div
          className="
          absolute
          -left-16
          -top-12
          w-24
          h-[420px]
          rotate-[18deg]
          bg-white/10
          blur-lg
        "
        />

        {/* Top Island */}
        <div
          className="
          absolute
          left-1/2
          -translate-x-1/2
          top-3
          w-[74px]
          h-[22px]
          rounded-full
          bg-black
          border
          border-white/10
        "
        />

        {/* Time */}
        <div
          className="
          absolute
          left-5
          top-5
          text-[11px]
          text-white/80
          font-semibold
        "
        >
          9:41
        </div>

        {/* Status */}
        <div
          className="
          absolute
          right-5
          top-5
          flex
          gap-1
        "
        >
          <div className="w-3 h-1.5 rounded bg-white/70"/>
          <div className="w-3 h-1.5 rounded bg-white/70"/>
          <div className="w-4 h-2 rounded-sm border border-white/70"/>
        </div>

        {/* Center */}
        <div
          className="
          absolute
          inset-0
          flex
          flex-col
          items-center
          justify-center
        "
        >
          {/* Shield Glow */}
          <div
            className="
            absolute
            w-28
            h-28
            rounded-full
            bg-violet-600/30
            blur-[40px]
          "
          />

          {/* Shield */}
          <div
            className="
            relative
            w-20
            h-20
            rounded-[22px]
            bg-gradient-to-br
            from-violet-500
            to-violet-900
            flex
            items-center
            justify-center
            shadow-[0_15px_40px_rgba(139,92,246,.45)]
          "
          >
            <Shield
              className="w-10 h-10 text-white"
              strokeWidth={2.4}
            />
          </div>

          {/* Logo */}
          <h2
            className="
            mt-6
            text-[18px]
            tracking-[0.35em]
            text-violet-400
            font-light
          "
          >
            KAVACH
          </h2>
        </div>

        {/* Bottom Glow */}
        <div
          className="
          absolute
          bottom-0
          w-full
          h-24
          bg-gradient-to-t
          from-violet-700/10
          to-transparent
        "
        />
      </div>
    </div>
  );
}
