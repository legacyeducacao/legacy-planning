export const SPEAKER_COLORS = [
  {
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  {
    border: "border-l-green-500",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  {
    border: "border-l-purple-500",
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  {
    border: "border-l-orange-500",
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  {
    border: "border-l-pink-500",
    badge: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  },
  {
    border: "border-l-teal-500",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  },
] as const

export const getSpeakerColor = (speaker: string) => {
  if (!speaker) return SPEAKER_COLORS[0]
  // Hash all chars so any speaker label (numeric, empty-prefix, etc.) maps stably
  let hash = 0
  for (let i = 0; i < speaker.length; i++) {
    hash = (hash * 31 + (speaker.codePointAt(i) ?? 0)) >>> 0
  }
  return SPEAKER_COLORS[hash % SPEAKER_COLORS.length]
}
