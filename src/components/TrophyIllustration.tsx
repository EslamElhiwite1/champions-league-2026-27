import React from 'react';

interface TrophyIllustrationProps {
  championName?: string | null;
  className?: string;
}

/**
 * Original vector illustration of the iconic twin-handled European Champion Clubs' Cup
 * silhouette, created specifically for this independent editorial project.
 * Provenance: Original authored SVG paths (no external scraping, no UEFA wordmark/emblem).
 */
export const TrophyIllustration: React.FC<TrophyIllustrationProps> = ({
  championName,
  className = '',
}) => {
  return (
    <figure className={`relative flex flex-col items-center select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(47, 123, 255, 0.14) 0%, rgba(216, 225, 238, 0.05) 38%, rgba(7, 13, 25, 0) 72%)',
        }}
      >
        <svg
          viewBox="0 0 240 280"
          className="h-44 w-36 sm:h-52 sm:w-44 xl:h-56 xl:w-48 drop-shadow-[0_14px_26px_rgba(0,0,0,0.55)]"
          role="img"
          aria-labelledby="ucl-trophy-title ucl-trophy-desc"
        >
          <title id="ucl-trophy-title">
            European Champion Clubs&apos; Cup Silhouette Illustration
          </title>
          <desc id="ucl-trophy-desc">
            Original vector illustration of the twin-handled European championship trophy with a
            flared silver chalice, curling handles, waisted stem, and stepped cylindrical base.
          </desc>

          <defs>
            <linearGradient id="silverBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6f7f98" />
              <stop offset="18%" stopColor="#c7d3e3" />
              <stop offset="42%" stopColor="#f5f8fd" />
              <stop offset="65%" stopColor="#aebdd3" />
              <stop offset="86%" stopColor="#dfe7f2" />
              <stop offset="100%" stopColor="#5d6c83" />
            </linearGradient>

            <linearGradient id="silverRim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7a8aa3" />
              <stop offset="35%" stopColor="#f8fbff" />
              <stop offset="70%" stopColor="#b5c3d8" />
              <stop offset="100%" stopColor="#627189" />
            </linearGradient>

            <linearGradient id="bowlInterior" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1b263b" />
              <stop offset="60%" stopColor="#46556e" />
              <stop offset="100%" stopColor="#8999b2" />
            </linearGradient>

            <linearGradient id="handleLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8eff8" />
              <stop offset="45%" stopColor="#9aaac2" />
              <stop offset="100%" stopColor="#596880" />
            </linearGradient>

            <linearGradient id="handleRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f2f6fc" />
              <stop offset="50%" stopColor="#a7b7cf" />
              <stop offset="100%" stopColor="#55637a" />
            </linearGradient>

            <linearGradient id="plinthBase" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b475d" />
              <stop offset="28%" stopColor="#8a9ab2" />
              <stop offset="52%" stopColor="#cfd9e7" />
              <stop offset="78%" stopColor="#6f7f97" />
              <stop offset="100%" stopColor="#2e384b" />
            </linearGradient>
          </defs>

          {/* Left iconic curling twin handle ("Big Ears") */}
          <path
            d="M 73 72
               C 44 62, 23 48, 25 32
               C 27 18, 46 18, 55 31
               C 60 39, 54 48, 46 46
               C 41 44, 41 37, 46 36
               C 42 29, 34 30, 34 39
               C 34 55, 51 74, 68 95
               C 76 105, 81 121, 86 138
               L 94 134
               C 89 114, 83 96, 73 72 Z"
            fill="url(#handleLeft)"
            stroke="#d7e2f1"
            strokeOpacity="0.45"
            strokeWidth="0.9"
          />

          {/* Right iconic curling twin handle ("Big Ears") */}
          <path
            d="M 167 72
               C 196 62, 217 48, 215 32
               C 213 18, 194 18, 185 31
               C 180 39, 186 48, 194 46
               C 199 44, 199 37, 194 36
               C 198 29, 206 30, 206 39
               C 206 55, 189 74, 172 95
               C 164 105, 159 121, 154 138
               L 146 134
               C 151 114, 157 96, 167 72 Z"
            fill="url(#handleRight)"
            stroke="#d7e2f1"
            strokeOpacity="0.45"
            strokeWidth="0.9"
          />

          {/* Cup interior shadow ellipse */}
          <ellipse cx="120" cy="48" rx="52" ry="9.5" fill="url(#bowlInterior)" />

          {/* Main flared bell-shaped bowl */}
          <path
            d="M 67 48
               C 69 78, 76 112, 88 142
               C 95 159, 102 172, 104 184
               L 136 184
               C 138 172, 145 159, 152 142
               C 164 112, 171 78, 173 48
               C 155 54, 138 56, 120 56
               C 102 56, 85 54, 67 48 Z"
            fill="url(#silverBody)"
          />

          {/* Specular vertical sheen stripe on bowl */}
          <path
            d="M 101 56 C 103 95, 107 140, 111 182 L 122 182 C 119 140, 117 95, 116 56 Z"
            fill="#ffffff"
            fillOpacity="0.22"
          />

          {/* Flared upper rim */}
          <ellipse
            cx="120"
            cy="48"
            rx="53.5"
            ry="10"
            fill="none"
            stroke="url(#silverRim)"
            strokeWidth="3.2"
          />
          <path
            d="M 67 52 C 85 58, 102 60, 120 60 C 138 60, 155 58, 173 52"
            fill="none"
            stroke="#4c5c75"
            strokeOpacity="0.55"
            strokeWidth="1.2"
          />

          {/* Subtle horizontal engraving lines on upper/mid bowl */}
          <path
            d="M 79 102 C 94 106, 107 107, 120 107 C 133 107, 146 106, 161 102"
            fill="none"
            stroke="#596a84"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <path
            d="M 88 140 C 99 143, 110 144, 120 144 C 130 144, 141 143, 152 140"
            fill="none"
            stroke="#596a84"
            strokeOpacity="0.45"
            strokeWidth="1"
          />

          {/* Waisted stem collar */}
          <rect x="102" y="183" width="36" height="7" rx="3.5" fill="url(#silverRim)" />
          <path
            d="M 105 190 C 106 198, 103 207, 98 214 L 142 214 C 137 207, 134 198, 135 190 Z"
            fill="url(#silverBody)"
          />
          <rect x="95" y="213" width="50" height="6" rx="2.5" fill="url(#silverRim)" />

          {/* Stepped cylindrical pedestal plinth */}
          <path
            d="M 92 219 L 148 219 L 154 242 C 132 246, 108 246, 86 242 Z"
            fill="url(#plinthBase)"
          />
          <path
            d="M 84 242 C 107 246, 133 246, 156 242 L 160 256 C 134 261, 106 261, 80 256 Z"
            fill="url(#plinthBase)"
          />
          <ellipse cx="120" cy="256" rx="41" ry="6.5" fill="url(#silverRim)" fillOpacity="0.35" />
          <path
            d="M 80 256 C 106 261, 134 261, 160 256"
            fill="none"
            stroke="#e4ecf7"
            strokeOpacity="0.45"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      <figcaption className="mt-2 text-center">
        {championName ? (
          <div className="space-y-0.5">
            <p className="text-xs font-medium tracking-wider uppercase text-[#7f91ad]">
              2026/27 Title Confirmed
            </p>
            <p className="font-display text-xl font-bold tracking-wide text-[#f4f7fb]">
              {championName}
            </p>
          </div>
        ) : (
          <p className="text-xs tracking-wide text-[#7f91ad]">
            European Cup · Winner TBD
          </p>
        )}
      </figcaption>
    </figure>
  );
};
