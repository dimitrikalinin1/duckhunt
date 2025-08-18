export const GameIcons = {
  Duck: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="duckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path
        d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zm8-6c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h8z"
        fill="url(#duckGradient)"
        stroke="#065f46"
        strokeWidth="1"
      />
      <circle cx="10" cy="10" r="1" fill="#065f46" />
      <path d="M14 8c.5 0 1 .5 1 1s-.5 1-1 1" stroke="#065f46" strokeWidth="1" fill="none" />
    </svg>
  ),

  Hunter: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="hunterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="16" height="8" rx="2" fill="url(#hunterGradient)" stroke="#9a3412" strokeWidth="1" />
      <circle cx="8" cy="12" r="1.5" fill="#9a3412" />
      <circle cx="16" cy="12" r="1.5" fill="#9a3412" />
      <rect x="10" y="6" width="4" height="2" rx="1" fill="#9a3412" />
      <path d="M6 16l2 2m8-2l2 2" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  Crosshair: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <circle cx="12" cy="12" r="8" fill="none" stroke="#ef4444" strokeWidth="2" />
      <path d="M12 4v4m0 8v4M4 12h4m8 0h4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="#ef4444" />
    </svg>
  ),

  Binoculars: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="binocularsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      <rect x="2" y="8" width="6" height="8" rx="3" fill="url(#binocularsGradient)" stroke="#92400e" strokeWidth="1" />
      <rect x="16" y="8" width="6" height="8" rx="3" fill="url(#binocularsGradient)" stroke="#92400e" strokeWidth="1" />
      <path d="M8 12h8" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="5" cy="12" r="2" fill="none" stroke="#92400e" strokeWidth="1" />
      <circle cx="19" cy="12" r="2" fill="none" stroke="#92400e" strokeWidth="1" />
    </svg>
  ),

  Beaver: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="beaverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <ellipse cx="12" cy="14" rx="8" ry="6" fill="url(#beaverGradient)" stroke="#78350f" strokeWidth="1" />
      <circle cx="9" cy="11" r="1" fill="#78350f" />
      <circle cx="15" cy="11" r="1" fill="#78350f" />
      <path d="M10 15c1 1 3 1 4 0" stroke="#78350f" strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="12" cy="18" rx="4" ry="2" fill="#92400e" />
    </svg>
  ),

  Coins: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="9" r="6" fill="url(#coinGradient)" stroke="#d97706" strokeWidth="1" />
      <circle cx="15" cy="15" r="6" fill="url(#coinGradient)" stroke="#d97706" strokeWidth="1" />
      <text x="9" y="13" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="bold">
        $
      </text>
      <text x="15" y="19" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="bold">
        $
      </text>
    </svg>
  ),

  Level: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <polygon
        points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"
        fill="url(#levelGradient)"
        stroke="#5b21b6"
        strokeWidth="1"
      />
      <circle cx="12" cy="12" r="3" fill="#5b21b6" />
    </svg>
  ),

  Play: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <polygon points="8,5 19,12 8,19" fill="url(#playGradient)" stroke="#065f46" strokeWidth="1" />
    </svg>
  ),

  Shop: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <defs>
        <linearGradient id="shopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <path
        d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4z"
        fill="url(#shopGradient)"
        stroke="#9a3412"
        strokeWidth="1"
      />
      <rect x="9" y="3" width="6" height="2" fill="#9a3412" />
    </svg>
  ),
}
