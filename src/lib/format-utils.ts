export const formatDuration = (seconds?: number): string => {
  if (!seconds) return "--:--"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "--"
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}
