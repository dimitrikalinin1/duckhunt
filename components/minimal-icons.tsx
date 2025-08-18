import type React from "react"

interface IconProps {
  size?: number
  className?: string
}

export const DuckIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 12c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4z" />
    <path d="M16 12h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
    <path d="M8 16H6a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2" />
    <circle cx="12" cy="10" r="1" />
  </svg>
)

export const HunterIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6" />
    <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24" />
    <path d="M1 12h6m6 0h6" />
    <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24" />
  </svg>
)

export const BinocularsIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="7" cy="15" r="4" />
    <circle cx="17" cy="15" r="4" />
    <path d="M7 11v4" />
    <path d="M17 11v4" />
    <path d="M11 11h2" />
  </svg>
)

export const CoinIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
)

export const LevelIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
)

export const PlayIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="5,3 19,12 5,21" />
  </svg>
)

export const StatsIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
)

export const ShopIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" x2="21" y1="6" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)
