import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 40,
  className = '',
  withGlow = false
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-cyan-500/15 blur-md pointer-events-none"
          style={{ transform: 'scale(1.1)' }}
        />
      )}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bg-box" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#1a202c" />
            <stop offset="100%" stopColor="#0d1117" />
          </linearGradient>
          <linearGradient id="cyan-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="red-glow" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#ff4d4d" />
          </linearGradient>
        </defs>

        {/* Rounded Icon Background */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          fill="url(#bg-box)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />

        {/* Magnifying Glass Outer Ring */}
        <circle
          cx="52"
          cy="46"
          r="26"
          stroke="url(#cyan-glow)"
          strokeWidth="4"
        />

        {/* Magnifying Glass Inner Ring */}
        <circle
          cx="52"
          cy="46"
          r="20"
          stroke="url(#cyan-glow)"
          strokeWidth="1.8"
          strokeOpacity="0.8"
        />

        {/* Handle */}
        <path
          d="M33 65 L21 77"
          stroke="url(#cyan-glow)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Handle Grip Details */}
        <rect
          x="19"
          y="74"
          width="8"
          height="6"
          rx="2"
          transform="rotate(-45 23 77)"
          fill="url(#cyan-glow)"
        />

        {/* Bar Chart inside Lens */}
        <rect
          x="43"
          y="50"
          width="3.5"
          height="8"
          rx="1"
          fill="#38bdf8"
          opacity="0.9"
        />
        <rect
          x="49"
          y="44"
          width="3.5"
          height="14"
          rx="1"
          fill="#38bdf8"
          opacity="0.9"
        />
        <rect
          x="55"
          y="47"
          width="3.5"
          height="11"
          rx="1"
          fill="#38bdf8"
          opacity="0.9"
        />

        {/* Ascending Trend Line with Arrow Head */}
        <path
          d="M40 50 L48 42 L54 48 L68 33"
          stroke="url(#red-glow)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow Head */}
        <path
          d="M61 33 H68 V40"
          stroke="url(#red-glow)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
