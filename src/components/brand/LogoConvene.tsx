import type { SVGProps } from "react"

interface LogoConveneProps extends SVGProps<SVGSVGElement> {
  size?: number
  color?: string
  accent?: string
}

export function LogoConvene({
  size = 44,
  color = "currentColor",
  accent,
  ...props
}: LogoConveneProps) {
  const a = accent || color
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      aria-label="Legacy Planning"
      {...props}
    >
      <path
        d="M22 9 L37 35 L7 35 Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <circle cx="22" cy="9" r="3.6" fill={a} />
      <circle cx="37" cy="35" r="3.6" fill={a} />
      <circle cx="7" cy="35" r="3.6" fill={a} />
    </svg>
  )
}
