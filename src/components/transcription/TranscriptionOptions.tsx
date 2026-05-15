import { useState } from "react"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Switch } from "../ui/switch"

const LANGUAGES = [
  { value: "auto", label: "Detectar automaticamente" },
  { value: "pt", label: "Português" },
  { value: "en", label: "Inglês" },
  { value: "es", label: "Espanhol" },
  { value: "fr", label: "Francês" },
  { value: "de", label: "Alemão" },
  { value: "it", label: "Italiano" },
  { value: "nl", label: "Holandês" },
  { value: "ja", label: "Japonês" },
  { value: "zh", label: "Chinês" },
  { value: "ar", label: "Árabe" },
  { value: "hi", label: "Hindi" },
  { value: "ru", label: "Russo" },
  { value: "ko", label: "Coreano" },
  { value: "tr", label: "Turco" },
  { value: "pl", label: "Polonês" },
  { value: "uk", label: "Ucraniano" },
  { value: "vi", label: "Vietnamita" },
  { value: "th", label: "Tailandês" },
  { value: "id", label: "Indonésio" },
  { value: "sv", label: "Sueco" },
  { value: "da", label: "Dinamarquês" },
  { value: "fi", label: "Finlandês" },
  { value: "no", label: "Norueguês" },
] as const

export interface AIFeatures {
  autoChapters: boolean
  summarization: boolean
  sentimentAnalysis: boolean
  entityDetection: boolean
  keyPhrases: boolean
  contentModeration: boolean
  topicDetection: boolean
}

const DEFAULT_AI_FEATURES: AIFeatures = {
  autoChapters: false,
  summarization: false,
  sentimentAnalysis: false,
  entityDetection: false,
  keyPhrases: false,
  contentModeration: false,
  topicDetection: false,
}

const AI_FEATURE_LIST: {
  key: keyof AIFeatures
  label: string
  description: string
}[] = [
  {
    key: "autoChapters",
    label: "Capítulos automáticos",
    description:
      "Divide a transcrição em capítulos com timestamp e resumo (mutuamente exclusivo com Resumo)",
  },
  {
    key: "summarization",
    label: "Resumo",
    description:
      "Gera um resumo do áudio em tópicos (mutuamente exclusivo com Capítulos)",
  },
  {
    key: "sentimentAnalysis",
    label: "Análise de sentimento",
    description: "Detecta sentimento positivo/negativo/neutro por frase",
  },
  {
    key: "entityDetection",
    label: "Detecção de entidades",
    description: "Identifica pessoas, locais e organizações mencionados",
  },
  {
    key: "keyPhrases",
    label: "Frases-chave",
    description: "Extrai frases e palavras-chave importantes",
  },
  {
    key: "contentModeration",
    label: "Moderação de conteúdo",
    description: "Sinaliza conteúdo potencialmente impróprio",
  },
  {
    key: "topicDetection",
    label: "Detecção de tópicos",
    description: "Classifica o conteúdo por taxonomia IAB",
  },
]

export interface TranscriptionOptionsProps {
  onChange: (options: {
    language: string
    diarize: boolean
    aiFeatures: AIFeatures
  }) => void
}

export function TranscriptionOptions({ onChange }: TranscriptionOptionsProps) {
  const [language, setLanguage] = useState<string>("auto")
  const [diarize, setDiarize] = useState<boolean>(false)
  const [aiFeatures, setAiFeatures] = useState<AIFeatures>(DEFAULT_AI_FEATURES)

  const allEnabled = AI_FEATURE_LIST.filter(
    (f) => f.key !== "summarization",
  ).every((f) => aiFeatures[f.key])

  const emitChange = (lang: string, dia: boolean, features: AIFeatures) => {
    onChange({ language: lang, diarize: dia, aiFeatures: features })
  }

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    emitChange(value, diarize, aiFeatures)
  }

  const handleDiarizeChange = (checked: boolean) => {
    setDiarize(checked)
    emitChange(language, checked, aiFeatures)
  }

  const handleFeatureToggle = (key: keyof AIFeatures) => {
    const updated = { ...aiFeatures, [key]: !aiFeatures[key] }
    if (key === "autoChapters" && updated.autoChapters) {
      updated.summarization = false
    } else if (key === "summarization" && updated.summarization) {
      updated.autoChapters = false
    }
    setAiFeatures(updated)
    emitChange(language, diarize, updated)
  }

  const handleToggleAll = (checked: boolean) => {
    const updated: AIFeatures = {
      autoChapters: checked,
      summarization: false,
      sentimentAnalysis: checked,
      entityDetection: checked,
      keyPhrases: checked,
      contentModeration: checked,
      topicDetection: checked,
    }
    setAiFeatures(updated)
    emitChange(language, diarize, updated)
  }

  return (
    <div className="space-y-5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-6 dark:border-gray-700/50 dark:bg-gray-800/40">
      <h3 className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        Opções de transcrição
      </h3>

      {/* Idioma */}
      <div className="space-y-2">
        <Label htmlFor="language">Idioma</Label>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o idioma" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Escolhe o idioma do áudio pra precisão maior
        </p>
      </div>

      {/* Diarização */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="diarize">Identificação de falantes</Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Separa cada falante. Útil pra entrevistas e reuniões.
          </p>
        </div>
        <Switch
          id="diarize"
          checked={diarize}
          onCheckedChange={handleDiarizeChange}
        />
      </div>

      {/* Recursos de análise por IA */}
      <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Recursos de análise por IA
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Esses recursos consomem processamento extra
          </p>
        </div>

        {/* Ativar todos */}
        <div className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-2.5 dark:bg-gray-700/50">
          <Label htmlFor="enable-all-ai" className="cursor-pointer">
            Ativar todos
          </Label>
          <Switch
            id="enable-all-ai"
            checked={allEnabled}
            onCheckedChange={handleToggleAll}
          />
        </div>

        {/* Toggles individuais */}
        <div className="space-y-1">
          {AI_FEATURE_LIST.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between rounded-md px-1 py-2"
            >
              <div className="mr-4 space-y-0.5">
                <Label
                  htmlFor={`ai-${feature.key}`}
                  className="cursor-pointer text-sm font-normal text-gray-700 dark:text-gray-300"
                >
                  {feature.label}
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
              <Switch
                id={`ai-${feature.key}`}
                checked={aiFeatures[feature.key]}
                onCheckedChange={() => handleFeatureToggle(feature.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
