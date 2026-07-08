import React from "react";
import { Bell, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationCard() {
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ 
        y: [0, -6, 0],
        opacity: 1 
      }}
      transition={{
        y: {
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut"
        },
        opacity: {
          duration: 0.8,
          ease: "easeOut"
        }
      }}
      className="
      absolute
      left-1/2
      bottom-12
      -translate-x-1/2
      z-50
      "
    >
      {/* Shadow */}
      <div
        className="
        absolute
        inset-0
        rounded-[22px]
        bg-violet-700/30
        blur-xl
        scale-110
        "
      />

      {/* Glass Card */}
      <div
        className="
        relative
        w-[245px]
        rounded-[22px]
        overflow-hidden
        border
        border-white/10
        bg-[rgba(34,30,55,.92)]
        backdrop-blur-2xl
        shadow-[0_20px_50px_rgba(0,0,0,.45)]
        px-5
        py-4
        "
      >
        {/* Noise */}
        <div
          className="
          absolute
          inset-0
          opacity-[0.05]
          bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_35%)]
        "
        />

        {/* Top */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="
              h-9
              w-9
              rounded-full
              bg-gradient-to-br
              from-violet-400
              to-violet-700
              flex
              items-center
              justify-center
              shadow-lg
              "
            >
              <Bell
                className="w-4 h-4 text-white"
                strokeWidth={2.4}
              />
            </div>

            <div className="text-left">
              <p
                className="
                text-white
                font-semibold
                text-[14px]
                "
              >
                KAVACH
              </p>
              <p
                className="
                text-white/60
                text-[11px]
                "
              >
                Security Notification
              </p>
            </div>
          </div>

          <span
            className="
            text-[11px]
            text-white/45
            "
          >
            now
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-3"/>

        {/* Message */}
        <div className="flex items-center gap-3 text-left">
          <div
            className="
            h-10
            w-10
            rounded-xl
            bg-violet-500/20
            flex
            items-center
            justify-center
            "
          >
            <ShieldCheck
              className="w-5 h-5 text-violet-300"
            />
          </div>

          <div>
            <p
              className="
              text-[15px]
              text-white
              font-semibold
              "
            >
              You're all safe!
            </p>
            <p
              className="
              text-[12px]
              text-white/60
              mt-0.5
              "
            >
              Monitoring is active
            </p>
          </div>
        </div>

        {/* Shine */}
        <div
          className="
          absolute
          -left-20
          -top-6
          h-40
          w-12
          rotate-[25deg]
          bg-white/10
          blur-xl
          "
        />
      </div>
    </motion.div>
  );
}
