"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"

export const AnalyticsOptOut = () => {
  const [isOptedOut, setIsOptedOut] = useState<boolean | null>(null)

  useEffect(() => {
    const optOutStatus = localStorage.getItem("analytics_opt_out")
    setIsOptedOut(optOutStatus === "true")
  }, [])

  const handleOptOut = () => {
    localStorage.setItem("analytics_opt_out", "true")
    setIsOptedOut(true)
    toast.success("Analytics tracking is now disabled for this browser.")
  }

  const handleOptIn = () => {
    localStorage.setItem("analytics_opt_out", "false")
    setIsOptedOut(false)
    toast.success("Analytics tracking is enabled again for this browser.")
  }

  if (isOptedOut === null) {
    return null
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      {isOptedOut ? (
        <div>
          <p className="mb-3 text-base">
            Analytics are currently disabled for this browser. You can opt back
            in at any time.
          </p>
          <Button onClick={handleOptIn} variant="outline" size="sm">
            Opt-In to Analytics
          </Button>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-base">
            You can disable Vercel Web Analytics for this browser at any time.
            We already strip query strings before events are sent.
          </p>
          <Button onClick={handleOptOut} variant="secondary" size="sm">
            Opt-Out of Analytics
          </Button>
        </div>
      )}
    </div>
  )
}
