import { LogoConvene } from "./LogoConvene"

interface LegacyWordmarkProps {
  color?: string
  accent?: string
  scale?: number
  stacked?: boolean
}

export function LegacyWordmark({
  color = "#fff",
  accent,
  scale = 1,
  stacked = true,
}: LegacyWordmarkProps) {
  const fontSize = 22 * scale
  const logoSize = 44 * scale

  return (
    <div
      className="flex items-center"
      style={{
        gap: `${14 * scale}px`,
        color,
      }}
    >
      <LogoConvene size={logoSize} color={color} accent={accent || color} />
      {stacked ? (
        <div
          className="font-sans font-bold uppercase"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 0.98,
            letterSpacing: "0.02em",
          }}
        >
          <div>Legacy</div>
          <div>Planning</div>
        </div>
      ) : (
        <div
          className="font-sans font-semibold uppercase whitespace-nowrap"
          style={{
            fontSize: `${fontSize * 0.95}px`,
            letterSpacing: "0.04em",
          }}
        >
          Legacy Planning
        </div>
      )}
    </div>
  )
}
