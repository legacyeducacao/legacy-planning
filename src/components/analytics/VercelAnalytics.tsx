"use client"

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react"

function beforeSend(event: BeforeSendEvent) {
  if (globalThis.localStorage.getItem("analytics_opt_out") === "true") {
    return null
  }

  const url = new URL(event.url)
  url.search = ""

  return {
    ...event,
    url: url.toString(),
  }
}

export function VercelAnalytics() {
  return <Analytics beforeSend={beforeSend} />
}
