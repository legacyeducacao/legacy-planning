import { create } from "zustand"
import type { AIFeatures } from "@/types/transcription"

const DEFAULT_AI_FEATURES: AIFeatures = {
  autoChapters: false,
  summarization: false,
  sentimentAnalysis: false,
  entityDetection: false,
  keyPhrases: false,
  contentModeration: false,
  topicDetection: false,
}

interface OptionsStore {
  language: string
  diarize: boolean
  aiFeatures: AIFeatures
  setLanguage: (lang: string) => void
  setDiarize: (val: boolean) => void
  toggleAiFeature: (key: keyof AIFeatures) => void
  setAllAiFeatures: (val: boolean) => void
  reset: () => void
}

export const useOptionsStore = create<OptionsStore>((set) => ({
  language: "auto",
  diarize: false,
  aiFeatures: DEFAULT_AI_FEATURES,

  setLanguage: (lang) => set({ language: lang }),

  setDiarize: (val) => set({ diarize: val }),

  toggleAiFeature: (key) =>
    set((state) => {
      const updated = { ...state.aiFeatures, [key]: !state.aiFeatures[key] }
      // autoChapters and summarization are mutually exclusive in AssemblyAI
      if (key === "autoChapters" && updated.autoChapters) {
        updated.summarization = false
      } else if (key === "summarization" && updated.summarization) {
        updated.autoChapters = false
      }
      return { aiFeatures: updated }
    }),

  setAllAiFeatures: (val) =>
    set({
      aiFeatures: {
        autoChapters: val,
        summarization: false, // mutually exclusive with autoChapters
        sentimentAnalysis: val,
        entityDetection: val,
        keyPhrases: val,
        contentModeration: val,
        topicDetection: val,
      },
    }),

  reset: () =>
    set({
      language: "auto",
      diarize: false,
      aiFeatures: DEFAULT_AI_FEATURES,
    }),
}))
