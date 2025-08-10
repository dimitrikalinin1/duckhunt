"use client"

type ShotSmokeProps = {
  keyId: number
}

export default function ShotSmoke({ keyId }: ShotSmokeProps) {
  // Renders a short-lived smoke puff and ripple ring; keyId forces restart
  return (
    <div key={keyId} className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* expanding ripple */}
      <div className="shot-ring" />
      {/* smoke puff */}
      <div className="shot-smoke" />
    </div>
  )
}
