export interface TranscriptionWord {
  word: string
  start: number
  end: number
  confidence?: number
  speaker?: string
}

export interface TranscriptionSegment {
  id: number
  start: number
  end: number
  text: string
  speaker?: string
  words?: TranscriptionWord[]
  tokens?: number[]
  avg_logprob?: number
  temperature?: number
  no_speech_prob?: number
  compression_ratio?: number
}

export interface Chapter {
  gist: string
  headline: string
  summary: string
  start: number
  end: number
}

export interface SentimentResult {
  text: string
  start: number
  end: number
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE"
  confidence: number
  speaker: string | null
}

export interface Entity {
  entityType: string
  text: string
  start: number
  end: number
}

export interface KeyPhrase {
  text: string
  count: number
  rank: number
  timestamps: { start: number; end: number }[]
}

export interface ContentSafety {
  results: unknown[]
  summary: Record<string, unknown>
}

export interface Topics {
  results: unknown[]
  summary: Record<string, unknown>
}

export interface TranscriptionIntelligence {
  chapters?: Chapter[]
  summary?: string
  sentimentAnalysis?: SentimentResult[]
  entities?: Entity[]
  keyPhrases?: KeyPhrase[]
  contentSafety?: ContentSafety
  topics?: Topics
}

export interface TranscriptionOutput {
  segments: TranscriptionSegment[]
  detected_language: string | null
  intelligence?: TranscriptionIntelligence
}

export interface AIFeatures {
  autoChapters: boolean
  summarization: boolean
  sentimentAnalysis: boolean
  entityDetection: boolean
  keyPhrases: boolean
  contentModeration: boolean
  topicDetection: boolean
}

export interface TranscriptionOptions {
  language: string
  diarize: boolean
  aiFeatures: AIFeatures
}

export interface AudioSource {
  name?: string
  url?: string
  duration?: number
  size?: number
  type: "file" | "url"
}

export type AtaStatus = "Não iniciado" | "Em andamento" | "Concluído"

export interface AtaParticipante {
  nome: string
  cargo?: string
}

export interface AtaDiscussao {
  topico: string
  pontos: string[]
}

export interface AtaPlanoAcao {
  descricao: string
  responsavel?: string
  prazo?: string
  status?: AtaStatus
}

export interface AtaProximaReuniao {
  data?: string
  horario?: string
  local?: string
  objetivo?: string
}

export interface Ata {
  // Cabeçalho
  empresa?: string
  projetoAssunto?: string
  tipoReuniao?: string
  data?: string
  horarioInicio?: string
  horarioTermino?: string
  duracao?: string
  localPlataforma?: string
  responsavelAta?: string
  liderReuniao?: string

  // Conteúdo
  titulo: string
  objetivo?: string
  participantes: AtaParticipante[]
  ausentes: AtaParticipante[]
  pauta: string[]
  discussoes: AtaDiscussao[]
  decisoes: string[]
  pendencias: string[]
  planoAcao: AtaPlanoAcao[]
  riscosObservacoes: string[]
  proximosPassos: string[]
  proximaReuniao?: AtaProximaReuniao
  horarioEncerramento?: string

  // Meta
  geradaEm: string
}
