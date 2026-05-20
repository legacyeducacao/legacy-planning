import type { SVGProps } from "react"

interface LogoApexProps extends SVGProps<SVGSVGElement> {
  size?: number
  color?: string
  accent?: string
}

export function LogoApex({
  size = 44,
  color = "currentColor",
  accent,
  ...props
}: LogoApexProps) {
  const c = accent || color
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
        d="M22 6 L40 38 L4 38 Z M22 6 L17 16 L27 16 Z"
        fill={c}
        fillRule="evenodd"
        stroke={c}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M14 28 L30 28"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.92"
      />
    </svg>
  )
}
