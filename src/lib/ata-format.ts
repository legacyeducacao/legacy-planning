import type { Ata, AtaParticipante, AtaPlanoAcao } from "@/types/transcription"

/**
 * Normalize an unknown payload (possibly an old-shape cached ata) into the
 * current Ata schema. Used when reading from localStorage so old caches keep
 * working after the schema evolved.
 */
export function normalizeAta(input: unknown): Ata {
  const o = (input ?? {}) as Record<string, unknown>

  const asStringArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []

  // participantes: string[] (old) → AtaParticipante[]
  let participantes: AtaParticipante[] = []
  if (Array.isArray(o.participantes)) {
    participantes = o.participantes.map((p): AtaParticipante => {
      if (typeof p === "string") return { nome: p }
      if (p && typeof p === "object") {
        const obj = p as Record<string, unknown>
        return {
          nome: typeof obj.nome === "string" ? obj.nome : "",
          cargo: typeof obj.cargo === "string" ? obj.cargo : undefined,
        }
      }
      return { nome: "" }
    })
  }

  const ausentes: AtaParticipante[] = Array.isArray(o.ausentes)
    ? o.ausentes
        .map((p): AtaParticipante => {
          if (typeof p === "string") return { nome: p }
          if (p && typeof p === "object") {
            const obj = p as Record<string, unknown>
            return {
              nome: typeof obj.nome === "string" ? obj.nome : "",
              cargo: typeof obj.cargo === "string" ? obj.cargo : undefined,
            }
          }
          return { nome: "" }
        })
        .filter((p) => p.nome)
    : []

  // discussoes
  const discussoes = Array.isArray(o.discussoes)
    ? o.discussoes
        .map((d) => {
          const obj = (d as Record<string, unknown>) ?? {}
          return {
            topico: typeof obj.topico === "string" ? obj.topico : "",
            pontos: asStringArr(obj.pontos),
          }
        })
        .filter((d) => d.topico || d.pontos.length > 0)
    : []

  // planoAcao: prefer new field; fall back to legacy encaminhamentos
  let planoAcao: AtaPlanoAcao[] = []
  if (Array.isArray(o.planoAcao)) {
    planoAcao = o.planoAcao.map((item): AtaPlanoAcao => {
      const obj = (item as Record<string, unknown>) ?? {}
      return {
        descricao: typeof obj.descricao === "string" ? obj.descricao : "",
        responsavel:
          typeof obj.responsavel === "string" ? obj.responsavel : undefined,
        prazo: typeof obj.prazo === "string" ? obj.prazo : undefined,
        status:
          obj.status === "Em andamento" || obj.status === "Concluído"
            ? obj.status
            : "Não iniciado",
      }
    })
  } else if (Array.isArray(o.encaminhamentos)) {
    planoAcao = o.encaminhamentos.map((enc): AtaPlanoAcao => {
      const obj = (enc as Record<string, unknown>) ?? {}
      return {
        descricao: typeof obj.acao === "string" ? obj.acao : "",
        responsavel:
          typeof obj.responsavel === "string" ? obj.responsavel : undefined,
        prazo: typeof obj.prazo === "string" ? obj.prazo : undefined,
        status: "Não iniciado",
      }
    })
  }

  const str = (k: string) =>
    typeof o[k] === "string" ? (o[k] as string) : undefined

  const proxRaw = (o.proximaReuniao ?? null) as Record<string, unknown> | null
  const proximaReuniao = proxRaw
    ? {
        data: typeof proxRaw.data === "string" ? proxRaw.data : undefined,
        horario:
          typeof proxRaw.horario === "string" ? proxRaw.horario : undefined,
        local: typeof proxRaw.local === "string" ? proxRaw.local : undefined,
        objetivo:
          typeof proxRaw.objetivo === "string" ? proxRaw.objetivo : undefined,
      }
    : undefined

  return {
    empresa: str("empresa"),
    projetoAssunto: str("projetoAssunto"),
    tipoReuniao: str("tipoReuniao"),
    data: str("data"),
    horarioInicio: str("horarioInicio"),
    horarioTermino: str("horarioTermino"),
    duracao: str("duracao"),
    localPlataforma: str("localPlataforma") ?? str("local"),
    responsavelAta: str("responsavelAta"),
    liderReuniao: str("liderReuniao"),

    titulo: typeof o.titulo === "string" ? o.titulo : "Ata de Reunião",
    objetivo: str("objetivo"),
    participantes,
    ausentes,
    pauta: asStringArr(o.pauta),
    discussoes,
    decisoes: asStringArr(o.decisoes),
    pendencias: asStringArr(o.pendencias),
    planoAcao,
    riscosObservacoes: asStringArr(o.riscosObservacoes),
    proximosPassos: asStringArr(o.proximosPassos),
    proximaReuniao,
    horarioEncerramento: str("horarioEncerramento") ?? str("horarioTermino"),

    geradaEm:
      typeof o.geradaEm === "string" ? o.geradaEm : new Date().toISOString(),
  }
}

function formatParticipante(p: AtaParticipante): string {
  return p.cargo ? `${p.nome} — ${p.cargo}` : p.nome
}

/**
 * Plain text da ata (sem markdown) — usado quando o corpo do email vai
 * incluir a ata inteira inline. Layout limpo, sem `#`, `*` ou `_`.
 *
 * Sempre renderiza todas as 11 seções; seções vazias ganham "(sem registro)"
 * pra deixar explícito o que foi/não foi discutido.
 */
export function ataToPlainText(ata: Ata): string {
  const out: string[] = []
  const EMPTY = "(sem registro)"

  out.push("ATA DE REUNIÃO")
  out.push("==============")
  if (ata.titulo) {
    out.push("")
    out.push(ata.titulo)
  }
  out.push("")

  const header: [string, string | undefined][] = [
    ["Empresa/Área", ata.empresa],
    ["Projeto/Assunto", ata.projetoAssunto],
    ["Tipo de reunião", ata.tipoReuniao],
    ["Data", ata.data],
    ["Horário de início", ata.horarioInicio],
    ["Horário de término", ata.horarioTermino],
    ["Local/Plataforma", ata.localPlataforma],
    ["Responsável pela ata", ata.responsavelAta],
    ["Líder da reunião", ata.liderReuniao],
  ]
  for (const [label, value] of header) {
    if (value) out.push(`${label}: ${value}`)
  }
  out.push("")

  // 1. Objetivo
  out.push("1. OBJETIVO DA REUNIÃO")
  out.push(ata.objetivo || EMPTY)
  out.push("")

  // 2. Participantes
  out.push("2. PARTICIPANTES")
  if (ata.participantes.length === 0) {
    out.push(EMPTY)
  } else {
    for (const p of ata.participantes)
      if (p.nome) out.push(`- ${formatParticipante(p)}`)
  }
  if (ata.ausentes.length > 0) {
    out.push("")
    out.push("Ausentes:")
    for (const p of ata.ausentes)
      if (p.nome) out.push(`- ${formatParticipante(p)}`)
  }
  out.push("")

  // 3. Pauta
  out.push("3. PAUTA")
  if (ata.pauta.length === 0) {
    out.push(EMPTY)
  } else {
    ata.pauta.forEach((item, i) => {
      if (item) out.push(`${i + 1}. ${item}`)
    })
  }
  out.push("")

  // 4. Resumo das discussões
  out.push("4. RESUMO DAS DISCUSSÕES")
  if (ata.discussoes.length === 0) {
    out.push(EMPTY)
  } else {
    ata.discussoes.forEach((d, i) => {
      out.push("")
      out.push(`4.${i + 1}. ${d.topico || "Tópico"}`)
      for (const ponto of d.pontos) if (ponto) out.push(`- ${ponto}`)
    })
  }
  out.push("")

  // 5. Decisões
  out.push("5. DECISÕES TOMADAS")
  if (ata.decisoes.length === 0) {
    out.push(EMPTY)
  } else {
    for (const d of ata.decisoes) if (d) out.push(`- ${d}`)
  }
  out.push("")

  // 6. Pendências
  out.push("6. PENDÊNCIAS IDENTIFICADAS")
  if (ata.pendencias.length === 0) {
    out.push(EMPTY)
  } else {
    for (const p of ata.pendencias) if (p) out.push(`- ${p}`)
  }
  out.push("")

  // 7. Plano de ação
  out.push("7. PLANO DE AÇÃO")
  if (ata.planoAcao.length === 0) {
    out.push(EMPTY)
  } else {
    ata.planoAcao.forEach((item, i) => {
      out.push("")
      out.push(`Ação ${i + 1}`)
      if (item.descricao) out.push(`Descrição: ${item.descricao}`)
      if (item.responsavel) out.push(`Responsável: ${item.responsavel}`)
      if (item.prazo) out.push(`Prazo: ${item.prazo}`)
      if (item.status) out.push(`Status: ${item.status}`)
    })
  }
  out.push("")

  // 8. Riscos e observações
  out.push("8. RISCOS, PONTOS DE ATENÇÃO E OBSERVAÇÕES")
  if (ata.riscosObservacoes.length === 0) {
    out.push(EMPTY)
  } else {
    for (const r of ata.riscosObservacoes) if (r) out.push(`- ${r}`)
  }
  out.push("")

  // 9. Próximos passos
  out.push("9. PRÓXIMOS PASSOS")
  if (ata.proximosPassos.length === 0) {
    out.push(EMPTY)
  } else {
    for (const p of ata.proximosPassos) if (p) out.push(`- ${p}`)
  }
  out.push("")

  // 10. Próxima reunião
  out.push("10. PRÓXIMA REUNIÃO")
  const pr = ata.proximaReuniao
  if (!pr || (!pr.data && !pr.horario && !pr.local && !pr.objetivo)) {
    out.push(EMPTY)
  } else {
    if (pr.data) out.push(`Data prevista: ${pr.data}`)
    if (pr.horario) out.push(`Horário: ${pr.horario}`)
    if (pr.local) out.push(`Local/Plataforma: ${pr.local}`)
    if (pr.objetivo) out.push(`Objetivo: ${pr.objetivo}`)
  }
  out.push("")

  // 11. Encerramento
  out.push("11. ENCERRAMENTO")
  const closingTime = ata.horarioEncerramento || ata.horarioTermino || "—"
  const registrante = ata.responsavelAta || "—"
  out.push(
    `Nada mais havendo a tratar, a reunião foi encerrada às ${closingTime}, e esta ata foi registrada por ${registrante}.`,
  )

  return out.join("\n").trimEnd()
}

export function ataToMarkdown(ata: Ata): string {
  const out: string[] = []

  out.push("# ATA DE REUNIÃO")
  out.push("")
  if (ata.titulo) {
    out.push(`**${ata.titulo}**`)
    out.push("")
  }

  // Cabeçalho
  const header: [string, string | undefined][] = [
    ["Empresa/Área", ata.empresa],
    ["Projeto/Assunto", ata.projetoAssunto],
    ["Tipo de reunião", ata.tipoReuniao],
    ["Data", ata.data],
    ["Horário de início", ata.horarioInicio],
    ["Horário de término", ata.horarioTermino],
    ["Local/Plataforma", ata.localPlataforma],
    ["Responsável pela ata", ata.responsavelAta],
    ["Líder da reunião", ata.liderReuniao],
  ]
  for (const [label, value] of header) {
    if (value) out.push(`**${label}:** ${value}`)
  }
  out.push("")

  // 1. Objetivo
  out.push("## 1. Objetivo da reunião")
  out.push(ata.objetivo || "_A definir._")
  out.push("")

  // 2. Participantes
  out.push("## 2. Participantes")
  if (ata.participantes.length === 0) {
    out.push("_Nenhum participante registrado._")
  } else {
    for (const p of ata.participantes)
      if (p.nome) out.push(`- ${formatParticipante(p)}`)
  }
  if (ata.ausentes.length > 0) {
    out.push("")
    out.push("**Ausentes:**")
    for (const p of ata.ausentes)
      if (p.nome) out.push(`- ${formatParticipante(p)}`)
  }
  out.push("")

  // 3. Pauta
  out.push("## 3. Pauta")
  if (ata.pauta.length === 0) {
    out.push("_A definir._")
  } else {
    ata.pauta.forEach((item, i) => {
      if (item) out.push(`${i + 1}. ${item}`)
    })
  }
  out.push("")

  // 4. Discussões
  out.push("## 4. Resumo das discussões")
  if (ata.discussoes.length === 0) {
    out.push("_Nenhum tópico registrado._")
  } else {
    ata.discussoes.forEach((d, i) => {
      out.push(`### 4.${i + 1}. ${d.topico || "Tópico"}`)
      for (const ponto of d.pontos) if (ponto) out.push(`- ${ponto}`)
      out.push("")
    })
  }
  out.push("")

  // 5. Decisões
  out.push("## 5. Decisões tomadas")
  if (ata.decisoes.length === 0) {
    out.push("_Nenhuma decisão registrada._")
  } else {
    for (const d of ata.decisoes) if (d) out.push(`- ${d}`)
  }
  out.push("")

  // 6. Pendências
  out.push("## 6. Pendências identificadas")
  if (ata.pendencias.length === 0) {
    out.push("_Nenhuma pendência registrada._")
  } else {
    for (const p of ata.pendencias) if (p) out.push(`- ${p}`)
  }
  out.push("")

  // 7. Plano de Ação
  out.push("## 7. Plano de ação")
  if (ata.planoAcao.length === 0) {
    out.push("_Nenhuma ação registrada._")
  } else {
    ata.planoAcao.forEach((item, i) => {
      out.push(`**Ação ${i + 1}**`)
      if (item.descricao) out.push(`- **Descrição:** ${item.descricao}`)
      if (item.responsavel) out.push(`- **Responsável:** ${item.responsavel}`)
      if (item.prazo) out.push(`- **Prazo:** ${item.prazo}`)
      if (item.status) out.push(`- **Status:** ${item.status}`)
      out.push("")
    })
  }

  // 8. Riscos
  out.push("## 8. Riscos, pontos de atenção e observações")
  if (ata.riscosObservacoes.length === 0) {
    out.push("_Nenhum risco ou observação registrada._")
  } else {
    for (const r of ata.riscosObservacoes) if (r) out.push(`- ${r}`)
  }
  out.push("")

  // 9. Próximos passos
  out.push("## 9. Próximos passos")
  if (ata.proximosPassos.length === 0) {
    out.push("_A definir._")
  } else {
    for (const p of ata.proximosPassos) if (p) out.push(`- ${p}`)
  }
  out.push("")

  // 10. Próxima reunião
  if (ata.proximaReuniao) {
    const pr = ata.proximaReuniao
    if (pr.data || pr.horario || pr.local || pr.objetivo) {
      out.push("## 10. Próxima reunião")
      if (pr.data) out.push(`- **Data prevista:** ${pr.data}`)
      if (pr.horario) out.push(`- **Horário:** ${pr.horario}`)
      if (pr.local) out.push(`- **Local/Plataforma:** ${pr.local}`)
      if (pr.objetivo) out.push(`- **Objetivo:** ${pr.objetivo}`)
      out.push("")
    }
  }

  // 11. Encerramento
  out.push("## 11. Encerramento")
  const closingTime = ata.horarioEncerramento || ata.horarioTermino || "—"
  const registrante = ata.responsavelAta || "—"
  out.push(
    `Nada mais havendo a tratar, a reunião foi encerrada às ${closingTime}, e esta ata foi registrada por ${registrante}.`,
  )
  out.push("")

  out.push("---")
  out.push(
    `*Gerada em ${new Date(ata.geradaEm).toLocaleString("pt-BR")} pelo LegacyPlanning*`,
  )

  return out.join("\n")
}
