import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx"
import type { Ata, AtaParticipante } from "@/types/transcription"

function text(s: string, opts?: { bold?: boolean; italic?: boolean }) {
  return new Paragraph({
    children: [
      new TextRun({ text: s, bold: opts?.bold, italics: opts?.italic }),
    ],
  })
}

function bullet(s: string) {
  return new Paragraph({ text: s, bullet: { level: 0 } })
}

function heading(
  s: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel],
) {
  return new Paragraph({
    text: s,
    heading: level,
    spacing: { before: 240, after: 120 },
  })
}

function spacer() {
  return new Paragraph({ children: [new TextRun("")] })
}

function metaRow(label: string, value: string | undefined): Paragraph[] {
  if (!value) return []
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        new TextRun({ text: value }),
      ],
    }),
  ]
}

function fmtParticipante(p: AtaParticipante) {
  return p.cargo ? `${p.nome} — ${p.cargo}` : p.nome
}

function buildSections(ata: Ata): Paragraph[] {
  const out: Paragraph[] = []

  out.push(
    new Paragraph({
      text: "ATA DE REUNIÃO",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
  )
  if (ata.titulo) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: ata.titulo, italics: true, size: 24 })],
      }),
    )
  }
  out.push(spacer())

  out.push(
    ...metaRow("Empresa/Área", ata.empresa),
    ...metaRow("Projeto/Assunto", ata.projetoAssunto),
    ...metaRow("Tipo de reunião", ata.tipoReuniao),
    ...metaRow("Data", ata.data),
    ...metaRow("Horário de início", ata.horarioInicio),
    ...metaRow("Horário de término", ata.horarioTermino),
    ...metaRow("Local/Plataforma", ata.localPlataforma),
    ...metaRow("Responsável pela ata", ata.responsavelAta),
    ...metaRow("Líder da reunião", ata.liderReuniao),
  )
  out.push(spacer())

  out.push(heading("1. Objetivo da reunião", HeadingLevel.HEADING_1))
  out.push(text(ata.objetivo || "A definir."))
  out.push(spacer())

  out.push(heading("2. Participantes", HeadingLevel.HEADING_1))
  if (ata.participantes.length === 0) {
    out.push(text("Nenhum participante registrado.", { italic: true }))
  } else {
    for (const p of ata.participantes)
      if (p.nome) out.push(bullet(fmtParticipante(p)))
  }
  if (ata.ausentes.length > 0) {
    out.push(spacer())
    out.push(text("Ausentes:", { bold: true }))
    for (const p of ata.ausentes)
      if (p.nome) out.push(bullet(fmtParticipante(p)))
  }
  out.push(spacer())

  out.push(heading("3. Pauta", HeadingLevel.HEADING_1))
  if (ata.pauta.length === 0) {
    out.push(text("A definir.", { italic: true }))
  } else {
    ata.pauta.forEach((item, i) => {
      if (item) out.push(text(`${i + 1}. ${item}`))
    })
  }
  out.push(spacer())

  out.push(heading("4. Resumo das discussões", HeadingLevel.HEADING_1))
  if (ata.discussoes.length === 0) {
    out.push(text("Nenhum tópico registrado.", { italic: true }))
  } else {
    ata.discussoes.forEach((d, i) => {
      out.push(
        heading(`4.${i + 1}. ${d.topico || "Tópico"}`, HeadingLevel.HEADING_2),
      )
      for (const ponto of d.pontos) if (ponto) out.push(bullet(ponto))
      out.push(spacer())
    })
  }

  out.push(heading("5. Decisões tomadas", HeadingLevel.HEADING_1))
  if (ata.decisoes.length === 0) {
    out.push(text("Nenhuma decisão registrada.", { italic: true }))
  } else {
    for (const d of ata.decisoes) if (d) out.push(bullet(d))
  }
  out.push(spacer())

  out.push(heading("6. Pendências identificadas", HeadingLevel.HEADING_1))
  if (ata.pendencias.length === 0) {
    out.push(text("Nenhuma pendência registrada.", { italic: true }))
  } else {
    for (const p of ata.pendencias) if (p) out.push(bullet(p))
  }
  out.push(spacer())

  out.push(heading("7. Plano de ação", HeadingLevel.HEADING_1))
  if (ata.planoAcao.length === 0) {
    out.push(text("Nenhuma ação registrada.", { italic: true }))
  } else {
    ata.planoAcao.forEach((item, i) => {
      out.push(text(`Ação ${i + 1}`, { bold: true }))
      if (item.descricao)
        out.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Descrição: ", bold: true }),
              new TextRun({ text: item.descricao }),
            ],
          }),
        )
      if (item.responsavel)
        out.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Responsável: ", bold: true }),
              new TextRun({ text: item.responsavel }),
            ],
          }),
        )
      if (item.prazo)
        out.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Prazo: ", bold: true }),
              new TextRun({ text: item.prazo }),
            ],
          }),
        )
      if (item.status)
        out.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Status: ", bold: true }),
              new TextRun({ text: item.status }),
            ],
          }),
        )
      out.push(spacer())
    })
  }

  out.push(
    heading(
      "8. Riscos, pontos de atenção e observações",
      HeadingLevel.HEADING_1,
    ),
  )
  if (ata.riscosObservacoes.length === 0) {
    out.push(text("Nenhuma observação registrada.", { italic: true }))
  } else {
    for (const r of ata.riscosObservacoes) if (r) out.push(bullet(r))
  }
  out.push(spacer())

  out.push(heading("9. Próximos passos", HeadingLevel.HEADING_1))
  if (ata.proximosPassos.length === 0) {
    out.push(text("A definir.", { italic: true }))
  } else {
    for (const p of ata.proximosPassos) if (p) out.push(bullet(p))
  }
  out.push(spacer())

  if (ata.proximaReuniao) {
    const pr = ata.proximaReuniao
    if (pr.data || pr.horario || pr.local || pr.objetivo) {
      out.push(heading("10. Próxima reunião", HeadingLevel.HEADING_1))
      out.push(
        ...metaRow("Data prevista", pr.data),
        ...metaRow("Horário", pr.horario),
        ...metaRow("Local/Plataforma", pr.local),
        ...metaRow("Objetivo", pr.objetivo),
      )
      out.push(spacer())
    }
  }

  out.push(heading("11. Encerramento", HeadingLevel.HEADING_1))
  const closingTime = ata.horarioEncerramento || ata.horarioTermino || "—"
  const registrante = ata.responsavelAta || "—"
  out.push(
    text(
      `Nada mais havendo a tratar, a reunião foi encerrada às ${closingTime}, e esta ata foi registrada por ${registrante}.`,
    ),
  )

  out.push(
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Gerada em ${new Date(ata.geradaEm).toLocaleString("pt-BR")} pelo LegacyPlanning`,
          italics: true,
          size: 18,
          color: "888888",
        }),
      ],
    }),
  )

  return out
}

export async function buildAtaDocx(ata: Ata): Promise<Blob> {
  const doc = new Document({
    sections: [{ children: buildSections(ata) }],
  })
  const buffer = await Packer.toBuffer(doc)
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
}
