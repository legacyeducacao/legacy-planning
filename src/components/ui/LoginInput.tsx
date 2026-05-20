import { Eye, EyeOff } from "lucide-react"
import { type InputHTMLAttributes, useState } from "react"

interface LoginInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: React.ReactNode
  error?: string
}

export function LoginInput({
  label,
  icon,
  error,
  type = "text",
  className = "",
  ...props
}: LoginInputProps) {
  const [pwVisible, setPwVisible] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword && pwVisible ? "text" : type

  return (
    <div className={`lp-field ${className}`}>
      <label className="lp-field-label">{label}</label>
      <div
        className="lp-field-input"
        style={error ? { borderColor: "var(--error, #cf2d56)" } : undefined}
      >
        {icon && <span className="lp-field-icon">{icon}</span>}
        <input type={inputType} {...props} />
        {isPassword && (
          <button
            type="button"
            onClick={() => setPwVisible((v) => !v)}
            style={{
              background: "none",
              border: 0,
              color: "inherit",
              cursor: "pointer",
              opacity: 0.6,
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
            aria-label={pwVisible ? "Esconder senha" : "Mostrar senha"}
          >
            {pwVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span
          className="text-xs font-medium transition-all"
          style={{
            color: "var(--error, #cf2d56)",
            marginTop: 4,
            paddingLeft: 4,
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
