/**
 * Envio de ata pro Discord via webhook.
 *
 * Discord webhook limits:
 *  - embed.title: 256 chars
 *  - embed.description: 4096 chars
 *  - embed.field.value: 1024 chars
 *  - 25 fields por embed, 10 embeds por mensagem
 *  - total embed size: 6000 chars
 *
 * Estratégia: 1 embed com header (empresa/data/tipo) + fields pra cada
 * sessão. Trunca campos que excedem com "...". Pra atas absurdamente longas,
 * a v1 só corta — versão futura pode anexar .md como arquivo via multipart.
 */

import type { Ata } from "@/types/transcription"

const LEGACY_COLOR = 0x2d5fde // azul Legacy (var --r-primary)
const FIELD_MAX = 1024
const TITLE_MAX = 256
const DESC_MAX = 4096

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 3)}...`
}

function formatPlanoAcao(ata: Ata): string {
  if (!ata.planoAcao || ata.planoAcao.length === 0) return ""
  return ata.planoAcao
    .map((acao) => {
      const parts = [`• ${acao.descricao}`]
      if (acao.responsavel) parts.push(`  Resp: ${acao.responsavel}`)
      if (acao.prazo) parts.push(`  Prazo: ${acao.prazo}`)
      return parts.join("\n")
    })
    .join("\n\n")
}

function formatList(items: string[] | undefined, prefix = "• "): string {
  if (!items || items.length === 0) return ""
  return items.map((i) => `${prefix}${i}`).join("\n")
}

function formatParticipantes(ata: Ata): string {
  if (!ata.participantes || ata.participantes.length === 0) return ""
  return ata.participantes
    .map((p) => (p.cargo ? `• ${p.nome} (${p.cargo})` : `• ${p.nome}`))
    .join("\n")
}

export async function sendAtaToDiscord(
  ata: Ata,
  webhookUrl: string,
  senderName?: string,
): Promise<void> {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = []

  // Header info como fields inline
  if (ata.empresa)
    fields.push({ name: "Empresa", value: ata.empresa, inline: true })
  if (ata.data) fields.push({ name: "Data", value: ata.data, inline: true })
  if (ata.tipoReuniao)
    fields.push({ name: "Tipo", value: ata.tipoReuniao, inline: true })

  if (ata.participantes && ata.participantes.length > 0) {
    fields.push({
      name: `Participantes (${ata.participantes.length})`,
      value: truncate(formatParticipantes(ata), FIELD_MAX),
    })
  }

  if (ata.decisoes && ata.decisoes.length > 0) {
    fields.push({
      name: "Decisões",
      value: truncate(formatList(ata.decisoes), FIELD_MAX),
    })
  }

  if (ata.planoAcao && ata.planoAcao.length > 0) {
    fields.push({
      name: "Plano de ação",
      value: truncate(formatPlanoAcao(ata), FIELD_MAX),
    })
  }

  if (ata.proximosPassos && ata.proximosPassos.length > 0) {
    fields.push({
      name: "Próximos passos",
      value: truncate(formatList(ata.proximosPassos), FIELD_MAX),
    })
  }

  const description = ata.objetivo
    ? truncate(ata.objetivo, DESC_MAX)
    : undefined

  const payload = {
    username: senderName || "LegacyPlanning",
    embeds: [
      {
        title: truncate(ata.titulo || "Ata de Reunião", TITLE_MAX),
        description,
        color: LEGACY_COLOR,
        fields: fields.slice(0, 25), // hard cap por embed
        footer: {
          text: ata.responsavelAta
            ? `Responsável: ${ata.responsavelAta}`
            : "LegacyPlanning",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(
      `Discord webhook falhou: ${response.status} ${body.slice(0, 200)}`,
    )
  }
}
