import React from 'react';

interface GatewayIllustrationProps {
  className?: string;
}

export const GatewayOfIndiaIllustration: React.FC<GatewayIllustrationProps> = ({
  className = 'w-full h-auto',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 420 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-h-56 drop-shadow-md"
        aria-label="Gateway of India, Mumbai - Maharashtra Government Service Portal"
        role="img"
      >
        <defs>
          {/* Gradients for sky backdrop & monument surfaces */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EBF4FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#DDEBFA" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="monumentMain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3A6EA5" />
            <stop offset="50%" stopColor="#004E98" />
            <stop offset="100%" stopColor="#002F5C" />
          </linearGradient>

          <linearGradient id="monumentLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5B8EC2" />
            <stop offset="100%" stopColor="#2E6299" />
          </linearGradient>

          <linearGradient id="monumentDeep" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#003870" />
            <stop offset="100%" stopColor="#001F3F" />
          </linearGradient>

          <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF9933" />
            <stop offset="50%" stopColor="#FFB366" />
            <stop offset="100%" stopColor="#FF6700" />
          </linearGradient>

          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#90CDF4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#63B3ED" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Ambient background soft circle / sun glow */}
        <circle cx="210" cy="140" r="110" fill="url(#skyGrad)" />
        <circle cx="210" cy="100" r="60" fill="#FF6700" fillOpacity="0.08" />

        {/* Subtle clouds / birds in skyline */}
        <path d="M 90 70 Q 100 62 110 70 Q 120 62 130 70" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M 290 55 Q 298 48 306 55 Q 314 48 322 55" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Base / Plinth steps of Gateway of India */}
        <rect x="50" y="246" width="320" height="8" rx="2" fill="#001F3F" />
        <rect x="65" y="238" width="290" height="8" rx="1.5" fill="#002F5C" />
        <rect x="75" y="230" width="270" height="8" rx="1" fill="#003870" />

        {/* Outer Flanking Wings (Left & Right) */}
        <rect x="85" y="140" width="45" height="90" fill="url(#monumentMain)" />
        <rect x="290" y="140" width="45" height="90" fill="url(#monumentMain)" />

        {/* Left Outer Arch */}
        <path
          d="M 95 230 L 95 180 Q 107.5 155 120 180 L 120 230 Z"
          fill="url(#monumentDeep)"
        />
        {/* Right Outer Arch */}
        <path
          d="M 300 230 L 300 180 Q 312.5 155 325 180 L 325 230 Z"
          fill="url(#monumentDeep)"
        />

        {/* Outer Wing Cornices & Balconies (Jharokhas) */}
        <rect x="80" y="134" width="55" height="6" rx="1" fill="#2E6299" />
        <rect x="285" y="134" width="55" height="6" rx="1" fill="#2E6299" />
        <rect x="88" y="124" width="39" height="10" rx="1.5" fill="url(#monumentLight)" />
        <rect x="293" y="124" width="39" height="10" rx="1.5" fill="url(#monumentLight)" />

        {/* Outer Corner Small Domes/Turrets */}
        <path d="M 88 124 C 88 108 127 108 127 124 Z" fill="url(#monumentMain)" />
        <path d="M 293 124 C 293 108 332 108 332 124 Z" fill="url(#monumentMain)" />
        {/* Turret finials */}
        <line x1="107.5" y1="108" x2="107.5" y2="100" stroke="url(#goldAccent)" strokeWidth="2" strokeLinecap="round" />
        <line x1="312.5" y1="108" x2="312.5" y2="100" stroke="url(#goldAccent)" strokeWidth="2" strokeLinecap="round" />

        {/* Central Gateway Body */}
        <rect x="130" y="100" width="160" height="130" fill="url(#monumentMain)" />

        {/* Center Grand Arch Facade & Moldings */}
        <path
          d="M 155 230 L 155 160 Q 170 120 210 120 Q 250 120 265 160 L 265 230 Z"
          fill="url(#monumentDeep)"
        />

        {/* Arch Rim / Band Accent */}
        <path
          d="M 150 230 L 150 160 Q 168 112 210 112 Q 252 112 270 160 L 270 230"
          stroke="url(#goldAccent)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Intricate Inner Arch Detail & Jali Lattice Silhouette */}
        <path
          d="M 165 230 L 165 168 Q 176 135 210 135 Q 244 135 255 168 L 255 230"
          stroke="#5B8EC2"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          fill="none"
        />

        {/* Center Frieze & Inscription Panel */}
        <rect x="145" y="90" width="130" height="12" rx="1.5" fill="#002F5C" />
        <rect x="150" y="93" width="120" height="6" rx="1" fill="#003870" />
        {/* Gold inscription line accent */}
        <line x1="156" y1="96" x2="264" y2="96" stroke="url(#goldAccent)" strokeWidth="1.5" strokeDasharray="6 3" />

        {/* Upper Parapet & Balustrade / Battlements */}
        <rect x="138" y="78" width="144" height="12" rx="2" fill="url(#monumentLight)" />
        {/* Battlements notches */}
        <path
          d="M 142 78 h 10 v 4 h -10 z M 158 78 h 10 v 4 h -10 z M 174 78 h 10 v 4 h -10 z M 190 78 h 10 v 4 h -10 z M 206 78 h 10 v 4 h -10 z M 222 78 h 10 v 4 h -10 z M 238 78 h 10 v 4 h -10 z M 254 78 h 10 v 4 h -10 z M 270 78 h 10 v 4 h -10 z"
          fill="#001F3F"
        />

        {/* 4 Corner Pylons/Minarets on Central Structure */}
        {/* Left-Inner Minaret */}
        <rect x="140" y="58" width="18" height="20" rx="1.5" fill="url(#monumentMain)" />
        <path d="M 140 58 C 140 45 158 45 158 58 Z" fill="url(#monumentLight)" />
        <line x1="149" y1="45" x2="149" y2="39" stroke="url(#goldAccent)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Right-Inner Minaret */}
        <rect x="262" y="58" width="18" height="20" rx="1.5" fill="url(#monumentMain)" />
        <path d="M 262 58 C 262 45 280 45 280 58 Z" fill="url(#monumentLight)" />
        <line x1="271" y1="45" x2="271" y2="39" stroke="url(#goldAccent)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Central Grand Dome of the Gateway of India */}
        <path
          d="M 175 78 C 175 42 245 42 245 78 Z"
          fill="url(#monumentMain)"
        />
        {/* Central Dome Ribs & Highlight */}
        <path
          d="M 190 78 C 190 50 230 50 230 78"
          stroke="#5B8EC2"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 210 42 L 210 78"
          stroke="#5B8EC2"
          strokeWidth="1.5"
        />
        {/* Kalasha / Finial on top of Central Dome */}
        <line x1="210" y1="42" x2="210" y2="30" stroke="url(#goldAccent)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="210" cy="28" r="3" fill="#FF9933" />

        {/* Harbor / Sea Water ripple foreground below steps */}
        <path d="M 30 262 C 100 258 180 266 260 260 C 320 256 370 263 390 260" stroke="#90CDF4" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M 60 270 C 130 267 210 273 290 269 C 340 266 380 271 400 269" stroke="#63B3ED" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Subtle Maharashtra Gateway Badge Pill */}
        <g transform="translate(142, 248)">
          <rect x="0" y="0" width="136" height="18" rx="9" fill="#002244" fillOpacity="0.9" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
          <text x="68" y="12" fill="#E2E8F0" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
            GATEWAY OF INDIA • MUMBAI
          </text>
        </g>
      </svg>
    </div>
  );
};
