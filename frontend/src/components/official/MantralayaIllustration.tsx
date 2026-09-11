import React from 'react';

interface MantralayaIllustrationProps {
  className?: string;
  opacity?: number;
}

/**
 * Architectural flat-vector illustration of the Maharashtra Government heritage institutional building.
 * Designed using FISOP palette: deep navy, royal government blue, warm amber/orange highlights, and crisp geometric vector lines.
 */
export const MantralayaIllustration: React.FC<MantralayaIllustrationProps> = ({
  className = 'w-full h-auto',
  opacity = 1.0,
}) => {
  return (
    <div
      className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
      style={{ opacity }}
      aria-label="Maharashtra Government Heritage Administrative Building, Mumbai"
      role="img"
    >
      <svg
        viewBox="0 0 540 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-h-48 drop-shadow-md"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="govSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="bldgMain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3A6EA5" />
            <stop offset="50%" stopColor="#004E98" />
            <stop offset="100%" stopColor="#002855" />
          </linearGradient>

          <linearGradient id="bldgDeep" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#003366" />
            <stop offset="100%" stopColor="#001733" />
          </linearGradient>

          <linearGradient id="bldgLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF9933" />
            <stop offset="50%" stopColor="#FDBA74" />
            <stop offset="100%" stopColor="#FF6700" />
          </linearGradient>

          <linearGradient id="windowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD166" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF9933" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Ambient background aura / subtle moon glow */}
        <circle cx="270" cy="110" r="100" fill="#3B82F6" fillOpacity="0.08" />
        <circle cx="270" cy="70" r="50" fill="#FF6700" fillOpacity="0.06" />

        {/* Ground plinth / base steps */}
        <rect x="20" y="194" width="500" height="8" rx="2" fill="#001733" />
        <rect x="40" y="188" width="460" height="6" rx="1.5" fill="#002855" />
        <rect x="55" y="182" width="430" height="6" rx="1" fill="#003870" />

        {/* ── Outer Left Wing ── */}
        <rect x="65" y="105" width="115" height="77" fill="url(#bldgMain)" />
        {/* Left wing cornice & balustrade */}
        <rect x="60" y="98" width="125" height="7" rx="1.5" fill="url(#bldgLight)" />
        <rect x="65" y="93" width="115" height="5" fill="#002855" />
        {/* Left pavilion roof */}
        <polygon points="65,93 122,70 180,93" fill="url(#bldgDeep)" />
        <line x1="122.5" y1="70" x2="122.5" y2="60" stroke="url(#goldHighlight)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Left wing windows (2 rows of 4 arched windows) */}
        {[80, 105, 130, 155].map((x, i) => (
          <g key={`lw-top-${i}`}>
            <rect x={x} y="112" width="14" height="18" rx="7" fill="url(#bldgDeep)" />
            <rect x={x + 2} y="116" width="10" height="12" rx="2" fill="url(#windowGlow)" />
            <rect x={x} y="142" width="14" height="22" rx="7" fill="url(#bldgDeep)" />
            <rect x={x + 2} y="147" width="10" height="15" rx="2" fill="url(#windowGlow)" />
          </g>
        ))}

        {/* ── Outer Right Wing ── */}
        <rect x="360" y="105" width="115" height="77" fill="url(#bldgMain)" />
        {/* Right wing cornice & balustrade */}
        <rect x="355" y="98" width="125" height="7" rx="1.5" fill="url(#bldgLight)" />
        <rect x="360" y="93" width="115" height="5" fill="#002855" />
        {/* Right pavilion roof */}
        <polygon points="360,93 417,70 475,93" fill="url(#bldgDeep)" />
        <line x1="417.5" y1="70" x2="417.5" y2="60" stroke="url(#goldHighlight)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Right wing windows (2 rows of 4 arched windows) */}
        {[375, 400, 425, 450].map((x, i) => (
          <g key={`rw-top-${i}`}>
            <rect x={x} y="112" width="14" height="18" rx="7" fill="url(#bldgDeep)" />
            <rect x={x + 2} y="116" width="10" height="12" rx="2" fill="url(#windowGlow)" />
            <rect x={x} y="142" width="14" height="22" rx="7" fill="url(#bldgDeep)" />
            <rect x={x + 2} y="147" width="10" height="15" rx="2" fill="url(#windowGlow)" />
          </g>
        ))}

        {/* ── Central Grand Block Facade ── */}
        <rect x="180" y="80" width="180" height="102" fill="url(#bldgMain)" />

        {/* Central Classical Columns (6 Grand Portico Columns) */}
        {[194, 222, 250, 278, 306, 334].map((x, i) => (
          <g key={`col-${i}`}>
            <rect x={x} y="98" width="12" height="84" rx="1.5" fill="url(#bldgLight)" />
            <rect x={x - 1} y="94" width="14" height="4" rx="1" fill="#FF9933" />
            <rect x={x - 1} y="178" width="14" height="4" rx="1" fill="#002855" />
          </g>
        ))}

        {/* Grand Pediment & Entablature */}
        <rect x="175" y="88" width="190" height="8" rx="1.5" fill="#002855" />
        <polygon points="175,88 270,52 365,88" fill="url(#bldgDeep)" />
        {/* Pediment border trim */}
        <polygon points="178,87 270,54 362,87" stroke="url(#goldHighlight)" strokeWidth="2" fill="none" />

        {/* Pediment Emblematical Circle */}
        <circle cx="270" cy="74" r="8" fill="#004E98" stroke="url(#goldHighlight)" strokeWidth="1.5" />

        {/* Central Heritage Dome & Clock / Finial */}
        {/* Dome Drum */}
        <rect x="246" y="32" width="48" height="20" rx="2" fill="url(#bldgMain)" />
        {/* Drum Columns */}
        {[250, 262, 274, 286].map((x, i) => (
          <rect key={`drum-${i}`} x={x} y="34" width="4" height="18" fill="url(#bldgLight)" />
        ))}
        {/* Grand Dome */}
        <path d="M 242 32 C 242 12 298 12 298 32 Z" fill="url(#bldgDeep)" stroke="url(#goldHighlight)" strokeWidth="1.5" />
        {/* Flagstaff & Indian Tri-color finial */}
        <line x1="270" y1="12" x2="270" y2="0" stroke="url(#goldHighlight)" strokeWidth="2" strokeLinecap="round" />
        {/* Mini Flag */}
        <path d="M 270 0 L 282 3 L 270 6 Z" fill="#FF9933" />

        {/* Central Grand Portico Entrance Arch */}
        <path
          d="M 248 182 L 248 135 Q 270 115 292 135 L 292 182 Z"
          fill="url(#bldgDeep)"
        />
        <path
          d="M 252 182 L 252 140 Q 270 124 288 140 L 288 182"
          stroke="url(#goldHighlight)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Subtle Maharashtra Institutional Banner Pill */}
        <g transform="translate(180, 198)">
          <rect x="0" y="0" width="180" height="18" rx="9" fill="#001733" fillOpacity="0.9" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
          <text x="90" y="12" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">
            MAHARASHTRA GOVERNMENT • MUMBAI
          </text>
        </g>
      </svg>
    </div>
  );
};

