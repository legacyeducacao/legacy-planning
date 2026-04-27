import * as React from "react"
import { motion } from "framer-motion"

interface AnimatedBackdropProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function AnimatedBackdrop({
  children,
  onClick,
  className = "",
}: AnimatedBackdropProps) {
  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:p-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClick}
        aria-label="Close overlay"
      />
      {children}
    </motion.div>
  )
}
