import { Loader2 } from "lucide-react"
import type { ButtonHTMLAttributes } from "react"

interface LoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
}

export function LoginButton({
  loading = false,
  loadingText = "ENTRANDO...",
  icon,
  children,
  className = "",
  disabled,
  ...props
}: LoginButtonProps) {
  return (
    <button
      className={`lp-btn-primary ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span className="flex items-center justify-center">{icon}</span>
      )}
      <span>{loading ? loadingText : children}</span>
    </button>
  )
}
