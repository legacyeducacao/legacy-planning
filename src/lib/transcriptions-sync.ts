/**
 * Sync de metadados de transcrição com Supabase Postgres.
 *
 * Cada usuário continua tendo seu IndexedDB local (acesso rápido).
 * Em paralelo, a metadata é replicada na tabela `transcriptions` do
 * Supabase pra:
 *   - Master ver transcrições de outros usuários (/history/equipe)
 *   - Eventual recuperação cross-device
 *
 * O áudio em si fica no Supabase Storage (bucket audio).
 *
 * Operações são best-effort: se Supabase falhar, log e segue (não bloqueia
 * UX local).
 */

import { getSupabase } from "@/lib/supabase"
import type { HistoryEntry } from "@/stores/history-store"

export interface RemoteTranscription {
  prediction_id: string
  owner_uid: string
  owner_email: string | null
  owner_display_name: string | null
  audio_name: string | null
  audio_url: string | null
  audio_size: number | null
  audio_recorded_at: number | null
  status: string
  language: string | null
  diarize: boolean | null
  created_at: number
  updated_at: string
}

interface UpsertArgs {
  entry: HistoryEntry
  ownerEmail?: string
  ownerDisplayName?: string
}

/**
 * Cria ou atualiza um registro de transcrição no Supabase.
 * Idempotente — usa prediction_id como chave única.
 */
export async function upsertTranscription({
  entry,
  ownerEmail,
  ownerDisplayName,
}: UpsertArgs): Promise<void> {
  if (!entry.ownerUid) return // sem owner não rastreia
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from("transcriptions").upsert(
      {
        prediction_id: entry.predictionId,
        owner_uid: entry.ownerUid,
        owner_email: ownerEmail ?? null,
        owner_display_name: ownerDisplayName ?? null,
        audio_name: entry.audioSource.name ?? null,
        audio_url: entry.audioSource.url ?? null,
        audio_size: entry.audioSource.size ?? null,
        audio_recorded_at: entry.audioSource.recordedAt ?? null,
        status: entry.status,
        language: entry.options.language ?? null,
        diarize: entry.options.diarize ?? null,
        created_at: entry.createdAt,
      },
      { onConflict: "prediction_id" },
    )
    if (error) console.warn("[sync] upsert transcrição falhou:", error.message)
  } catch (err) {
    console.warn(
      "[sync] upsert exception:",
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Atualiza só o status de uma transcrição (chamado pelo polling).
 */
export async function patchTranscriptionStatus(
  predictionId: string,
  status: string,
): Promise<void> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from("transcriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("prediction_id", predictionId)
    if (error) console.warn("[sync] patch status falhou:", error.message)
  } catch (err) {
    console.warn(
      "[sync] patch exception:",
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Lista todas as transcrições EXCETO as do usuário atual.
 * Usado pela página /history/equipe (visão master).
 */
export async function listTeamTranscriptions(
  excludeOwnerUid: string,
): Promise<RemoteTranscription[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("transcriptions")
      .select("*")
      .neq("owner_uid", excludeOwnerUid)
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) {
      console.error("[sync] list team falhou:", error.message)
      return []
    }
    return (data ?? []) as RemoteTranscription[]
  } catch (err) {
    console.error(
      "[sync] list exception:",
      err instanceof Error ? err.message : err,
    )
    return []
  }
}
