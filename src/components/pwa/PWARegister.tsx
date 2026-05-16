"use client"

import { useEffect } from "react"

/**
 * Registra o Service Worker em produção. Em dev (Next.js + Turbopack) o SW
 * fica desligado pra não fazer cache da build em desenvolvimento.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") return

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Recarrega quando uma nova versão estiver pronta
          reg.addEventListener("updatefound", () => {
            const nw = reg.installing
            if (!nw) return
            nw.addEventListener("statechange", () => {
              if (
                nw.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Tem SW antigo controlando; o novo virou waiting.
                // Mantém silencioso — o user pega o update no próximo refresh.
              }
            })
          })
        })
        .catch((err) => {
          console.warn("[pwa] SW registration failed:", err)
        })
    }

    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
    }
  }, [])

  return null
}
