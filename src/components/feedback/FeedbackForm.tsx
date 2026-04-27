import { useEffect, useMemo, useRef, useState } from "react"
import DeviceDetector from "device-detector-js"
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "../ui/button"

type FeedbackType = "general" | "issue" | "feature" | "other"

interface FeedbackFormProps {
  initialType?: FeedbackType
  onClose?: () => void
}

const TALLY_EMBED_SRC = "https://tally.so/embed/9q6x7Q"
const TALLY_SCRIPT_SRC = "https://tally.so/widgets/embed.js"
const DEFAULT_IFRAME_HEIGHT = 420

declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void
    }
  }
}

export function FeedbackForm({
  initialType = "general",
  onClose,
}: FeedbackFormProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [iframeHeight, setIframeHeight] = useState(DEFAULT_IFRAME_HEIGHT)
  const [embedScale, setEmbedScale] = useState(1)

  const embedSrc = useMemo(() => {
    try {
      const deviceDetector = new DeviceDetector()
      const device = deviceDetector.parse(navigator.userAgent)

      let browser = navigator.userAgent
      if (device.client?.name) {
        browser = device.client.version
          ? `${device.client.name} ${device.client.version}`
          : device.client.name
      }

      let operatingSystem = "Unknown"
      if (device.os?.name) {
        operatingSystem = device.os.version
          ? `${device.os.name} ${device.os.version}`
          : device.os.name
      }

      const params = new URLSearchParams()
      params.set("alignLeft", "1")
      params.set("hideTitle", "1")
      params.set("transparentBackground", "1")
      params.set("dynamicHeight", "1")
      params.set("feedbackType", initialType)
      params.set("browser", browser)
      params.set("os", operatingSystem)
      params.set("operatingSystem", operatingSystem)
      params.set("originPage", globalThis.location.pathname)

      return `${TALLY_EMBED_SRC}?${params.toString()}`
    } catch (error) {
      console.error("Error preparing Tally feedback embed:", error)
      return ""
    }
  }, [initialType])

  const displayError =
    loadError ||
    (embedSrc ? "" : "Unable to prepare the feedback form right now.")

  useEffect(() => {
    if (!embedSrc) return

    const loadEmbeds = () => {
      if (globalThis.window.Tally) {
        globalThis.window.Tally.loadEmbeds()
        return
      }

      document
        .querySelectorAll<HTMLIFrameElement>(
          "iframe[data-tally-src]:not([src])",
        )
        .forEach((iframe) => {
          iframe.src = iframe.dataset.tallySrc || ""
        })
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TALLY_SCRIPT_SRC}"]`,
    )

    if (existingScript) {
      loadEmbeds()
      return
    }

    const script = document.createElement("script")
    script.src = TALLY_SCRIPT_SRC
    script.async = true
    script.onload = loadEmbeds
    script.onerror = () => {
      setLoadError(
        "The embedded form failed to load. Try opening it in a new tab.",
      )
      loadEmbeds()
    }

    document.body.appendChild(script)
  }, [embedSrc])

  useEffect(() => {
    const iframe = iframeRef.current

    if (!iframe || typeof ResizeObserver === "undefined") {
      return
    }

    const updateHeight = () => {
      setIframeHeight(Math.max(iframe.offsetHeight, DEFAULT_IFRAME_HEIGHT))
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(iframe)

    return () => {
      observer.disconnect()
    }
  }, [embedSrc, isReady])

  useEffect(() => {
    if (globalThis.window === undefined) {
      return
    }

    const updateScale = () => {
      const reservedHeight = onClose ? 250 : 190
      const availableHeight = Math.max(
        globalThis.innerHeight - reservedHeight,
        320,
      )
      const nextScale =
        iframeHeight > availableHeight ? availableHeight / iframeHeight : 1

      setEmbedScale(Number(nextScale.toFixed(3)))
    }

    updateScale()
    globalThis.addEventListener("resize", updateScale)

    return () => {
      globalThis.removeEventListener("resize", updateScale)
    }
  }, [iframeHeight, onClose])

  return (
    <div className="w-full">
      {displayError ? (
        <div className="space-y-4">
          <div className="flex items-start rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/30">
            <AlertCircle className="mt-0.5 mr-3 h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">
                Failed to load form
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {displayError}
              </p>
            </div>
          </div>

          {embedSrc && (
            <Button asChild className="w-full">
              <a href={embedSrc} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open feedback form
              </a>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!isReady && (
            <div className="border-border bg-muted/40 text-muted-foreground flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading feedback form...
            </div>
          )}

          {embedSrc && (
            <div
              className="overflow-hidden rounded-md"
              style={{
                height: `${Math.round(iframeHeight * embedScale)}px`,
              }}
            >
              <iframe
                ref={iframeRef}
                data-tally-src={embedSrc}
                loading="lazy"
                width="100%"
                height={DEFAULT_IFRAME_HEIGHT}
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                title="Transcriptr Feedback"
                onLoad={() => setIsReady(true)}
                className={
                  isReady
                    ? "origin-top-left border-0 opacity-100"
                    : "origin-top-left border-0 opacity-0"
                }
                style={{
                  width: `${100 / embedScale}%`,
                  height: `${iframeHeight}px`,
                  transform: `scale(${embedScale})`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:flex-1"
              >
                Cancel
              </Button>
            )}

            {embedSrc && (
              <Button
                asChild
                variant="outline"
                className={onClose ? "w-full sm:flex-1" : "w-full"}
              >
                <a href={embedSrc} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
