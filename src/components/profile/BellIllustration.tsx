import React from "react";

export default function BellIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 360 360"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        {/* Main Bell */}
        <linearGradient id="bellBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D8B4FE" />
          <stop offset="30%" stopColor="#A855F7" />
          <stop offset="70%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>

        {/* Highlight */}
        <linearGradient id="highlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity=".9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Base */}
        <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#3B0764" />
        </linearGradient>

        {/* Glow */}
        <filter id="purpleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
            1 0 0 0 0
            0 0 1 0 0
            1 0 1 0 0
            0 0 0 12 -5"
          />
        </filter>

        <filter id="shadow">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="12"
            floodColor="#5B21B6"
            floodOpacity=".45"
          />
        </filter>
      </defs>

      {/* Purple Glow */}
      <ellipse
        cx="170"
        cy="300"
        rx="95"
        ry="20"
        fill="#7C3AED"
        opacity=".25"
        filter="url(#purpleGlow)"
      />

      {/* Bell Handle */}
      <rect
        x="150"
        y="38"
        width="42"
        height="26"
        rx="13"
        fill="url(#bellBody)"
      />

      {/* Top */}
      <ellipse
        cx="171"
        cy="65"
        rx="52"
        ry="28"
        fill="url(#bellBody)"
      />

      {/* Bell */}
      <path
        filter="url(#shadow)"
        d="
        M115 82
        C115 38 145 20 171 20
        C197 20 228 38 228 82

        L238 196

        C238 220 216 236 190 236

        L152 236

        C126 236 104 220 104 196

        Z"
        fill="url(#bellBody)"
      />

      {/* Bottom Rim */}
      <ellipse
        cx="171"
        cy="236"
        rx="67"
        ry="16"
        fill="#5B21B6"
      />

      {/* Clapper */}
      <circle
        cx="171"
        cy="218"
        r="13"
        fill="#C084FC"
      />

      {/* Highlight */}
      <path
        d="
        M142 74
        C122 96 120 170 130 208"
        stroke="url(#highlight)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Reflection */}
      <ellipse
        cx="155"
        cy="55"
        rx="18"
        ry="8"
        fill="white"
        opacity=".55"
      />

      {/* Floating Particles */}
      <circle cx="54" cy="82" r="2.8" fill="#C084FC"/>
      <circle cx="82" cy="54" r="1.8" fill="#E9D5FF"/>
      <circle cx="290" cy="72" r="2.5" fill="#A855F7"/>
      <circle cx="305" cy="115" r="1.8" fill="#DDD6FE"/>
      <circle cx="285" cy="175" r="2.2" fill="#A855F7"/>
      <circle cx="60" cy="170" r="2.4" fill="#A855F7"/>

      {/* Orbit */}
      <ellipse
        cx="171"
        cy="286"
        rx="92"
        ry="24"
        stroke="#6D28D9"
        strokeWidth="3"
        opacity=".45"
      />

      <ellipse
        cx="171"
        cy="286"
        rx="68"
        ry="14"
        stroke="#A855F7"
        strokeWidth="2"
        opacity=".5"
      />
    </svg>
  );
}
