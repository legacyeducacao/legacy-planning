import { useEffect, useState } from "react"
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
  const [embedSrc, setEmbedSrc] = useState("")
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    setIsReady(false)

    try {
      const deviceDetector = new DeviceDetector()
      const device = deviceDetector.parse(navigator.userAgent)

      const browser = device.client?.name
        ? device.client.version
          ? `${device.client.name} ${device.client.version}`
          : device.client.name
        : navigator.userAgent

      const operatingSystem = device.os?.name
        ? device.os.version
          ? `${device.os.name} ${device.os.version}`
          : device.os.name
        : navigator.platform || "Unknown"

      const params = new URLSearchParams(window.location.search)
      params.set("alignLeft", "1")
      params.set("hideTitle", "1")
      params.set("transparentBackground", "1")
      params.set("dynamicHeight", "1")
      params.set("feedbackType", initialType)
      params.set("browser", browser)
      params.set("os", operatingSystem)
      params.set("operatingSystem", operatingSystem)
      params.set("originPage", window.location.pathname)
      params.set("originUrl", window.location.href)

      setEmbedSrc(`${TALLY_EMBED_SRC}?${params.toString()}`)
      setLoadError("")
    } catch (error) {
      console.error("Error preparing Tally feedback embed:", error)
      setLoadError("Unable to prepare the feedback form right now.")
    }
  }, [initialType])

  useEffect(() => {
    if (!embedSrc) return

    const loadEmbeds = () => {
      if (window.Tally) {
        window.Tally.loadEmbeds()
        return
      }

      document
        .querySelectorAll<HTMLIFrameElement>("iframe[data-tally-src]:not([src])")
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
      setLoadError("The embedded form failed to load. Try opening it in a new tab.")
      loadEmbeds()
    }

    document.body.appendChild(script)
  }, [embedSrc])

  return (
    <div className="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        Browser and operating system details are forwarded to Tally for this
        submission.
      </p>

      {loadError ? (
        <div className="space-y-4">
          <div className="flex items-start rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/30">
            <AlertCircle className="mt-0.5 mr-3 h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">
                Failed to load form
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {loadError}
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
            <div className="flex items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading feedback form...
            </div>
          )}

          {embedSrc && (
            <iframe
              data-tally-src={embedSrc}
              loading="lazy"
              width="100%"
              height="420"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              title="Transcriptr Feedback"
              onLoad={() => setIsReady(true)}
              className={isReady ? "w-full" : "w-full opacity-0"}
            />
          )}

          <div className="flex gap-2">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            )}

            {embedSrc && (
              <Button
                asChild
                variant="outline"
                className={onClose ? "flex-1" : "w-full"}
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
