"use client"

import confetti from "canvas-confetti"
import { AnimatePresence, motion } from "framer-motion"
import { ExternalLink, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AnimatedBackdrop } from "./animated-backdrop"

const STORAGE_KEY = "seen_v3_4_release"

const highlights = [
  {
    icon: "🗺️",
    title: "Fluxo do app baseado em rotas",
    description:
      "Rotas dedicadas pra upload, histórico, studio, docs e telas de erro",
  },
  {
    icon: "📱",
    title: "Navegação mobile no topo",
    description:
      "Nova barra de abas no topo com menu 'Mais' substituindo o drawer antigo",
  },
  {
    icon: "🎛️",
    title: "Studio reconstruído",
    description:
      "Áudio, transcrição, exportação e estatísticas separados em componentes focados",
  },
  {
    icon: "⚡",
    title: "Gerenciamento de estado com Zustand",
    description:
      "Stores dedicados pro histórico de transcrições e persistência de opções",
  },
  {
    icon: "🎨",
    title: "Atualização dos design tokens",
    description:
      "Tema Tailwind mais limpo e estilo de componentes mais consistente",
  },
]

export function ReleaseModal() {
  const [open, setOpen] = useState(false)
  const firedConfetti = useRef(false)
  const router = useRouter()

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true)
      }
    } catch {
      // localStorage indisponível (ex: navegação privada) — pula
    }
  }, [])

  useEffect(() => {
    if (open && !firedConfetti.current) {
      firedConfetti.current = true
      const end = Date.now() + 1800

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.5 },
          colors: ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.5 },
          colors: ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"],
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }

      frame()
    }
  }, [open])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // ignora
    }
    setOpen(false)
  }

  const handleChangelog = () => {
    dismiss()
    router.push("/changelog")
  }

  return (
    <AnimatePresence>
      {open && (
        <AnimatedBackdrop onClick={dismiss}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="release-modal-title"
            className="relative mx-auto max-h-[calc(100vh-2rem)] w-full max-w-[min(36rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 24 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient strip */}
            <div className="rounded-t-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 px-6 py-6 text-white">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="h-5 w-5 text-yellow-300"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
                    Novidades
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="Fechar novidades"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h2
                id="release-modal-title"
                className="text-2xl font-bold leading-tight"
              >
                LegacyPlanning v3.4 chegou
              </h2>
              <p className="mt-1 text-sm text-indigo-200">
                Atualização grande de arquitetura: fluxo do app mais limpo e
                studio reconstruído.
              </p>
            </div>

            {/* Highlights */}
            <div className="px-6 py-4">
              <ul className="space-y-3" aria-label="Destaques da v3.4">
                {highlights.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800"
                  >
                    <span
                      className="mt-0.5 text-xl leading-none"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* 3.4.1 secondary note */}
              <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                Mais 30+ correções de bug e segurança na v3.4.1
              </p>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col gap-2 px-6 pb-6 sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleChangelog}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Ver changelog completo
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Dispensar
              </button>
            </div>
          </motion.div>
        </AnimatedBackdrop>
      )}
    </AnimatePresence>
  )
}
