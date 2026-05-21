# Catálogo de Produtos Legacy

> **Como ler este arquivo**: cada produto **com PRD-fonte na pasta `Produtos/`** tem um `.md` detalhado em `produtos/<slug>.md` (este folder). Os produtos sem documentação formal aparecem como entrada curta no final — completar quando houver doc oficial.
>
> **Fonte da verdade**: os valores neste catálogo refletem o que está nos PDFs/DOCX da pasta `Produtos/` (datados em maio/2026). Propostas internas em discussão **NÃO** estão registradas aqui — vão para a documentação do produto quando viram decisão.

## Por categoria

### Topo de funil
- **Inteligência Empresarial (IE)** — curso online 39h/16 módulos, ticket não informado. Evento de lead: `Lead_ie`. Detalhes: [produtos/inteligencia-empresarial.md](produtos/inteligencia-empresarial.md)
- **Análise Tributária Inteligente** — SaaS B2B, **R$ 197/mês**. Conhecido internamente como "Legacy Tributos". Detalhes: [produtos/analise-tributaria-inteligente.md](produtos/analise-tributaria-inteligente.md)

### Meio de funil
- **Impulsão Empresarial Anual** — programa de 12 meses, **R$ 8.797,90** (reformulado em 11/05/2026). Evento de lead: `Lead_Imersao`. Detalhes: [produtos/impulsao-empresarial.md](produtos/impulsao-empresarial.md)
- **AI na Prática — Imersão Empresarial** — imersão presencial 3 dias (turma aberta), **R$ 1.497**. Detalhes: [produtos/imersao-ia-empresarial.md](produtos/imersao-ia-empresarial.md)
- **AI na Prática — Imersão In Company** — imersão presencial 3 dias (exclusiva), **R$ 45.000**. Detalhes: [produtos/imersao-ia-in-company.md](produtos/imersao-ia-in-company.md)
- **iPreço** — imersão presencial 3 dias + SaaS gastronomia, **R$ 1.497 imersão** + SaaS recorrente. Detalhes: [produtos/ipreco.md](produtos/ipreco.md)

### Fundo de funil
- **Legado Empresarial** — programa híbrido de 1 ano (BSC, 5 pilares), **R$ 35.000**. Turma 16 em andamento. Evento de lead: `MQL`. Detalhes: [produtos/legado-empresarial.md](produtos/legado-empresarial.md)
- **InCompany Completa** — implementação executiva com executor dedicado, 12-15 semanas, **R$ 180.000**. Detalhes: [produtos/incompany.md](produtos/incompany.md)

### SaaS proprietários
- **Legacy Plan** — plataforma central de executoria (11 fases / 34 etapas). 6 SKUs de R$ 97,90 a R$ 1.397,90/mês. Roda Turma 16 do Legado + Incompany. Detalhes: [produtos/legacy-plan.md](produtos/legacy-plan.md)
- **LegacyFin** — SaaS de gestão financeira standalone (MEI/PME até R$ 4,8M/ano). URL: `legacyfin.lovable.app`. Detalhes: [produtos/legacyfin.md](produtos/legacyfin.md)
- **Legacy Squad** — plataforma open source (MIT) de orquestração de agentes IA. v0.1.15 (27/04/2026). Detalhes: [produtos/legacy-squad.md](produtos/legacy-squad.md)

---

## Produtos mencionados internamente mas SEM doc-fonte

Estas entradas aparecem em conversas e materiais internos mas ainda não têm PRD na pasta `Produtos/`. Quando houver doc, criar `.md` próprio em `produtos/` e mover a entrada pra seção correspondente acima.

- **Luma Agent** — IA embarcada no Legacy Plan. **Não é produto separado** — é módulo/feature do Legacy Plan. Ver [produtos/legacy-plan.md](produtos/legacy-plan.md).
- **Legacy Academy** — plataforma proprietária de educação estilo Hotmart/Kiwify. Mencionada como substituta do QuickFee. **Sem PRD.**
- **LegacyProd** — sistema interno de estruturação de produtos educacionais (briefing → produto pronto via Smart Import por IA, Matriz CDT, Big Idea, Mapa Mental, Roadmap). **PRD interno existe (`Produtos/LegacyProd_PRD.pdf`)** mas é ferramenta interna, não produto comercial — não foi criado `.md` próprio.
- **CRM da Legacy** — em validação pelo time comercial. **Sem PRD.**
- **BI da Legacy** — em desenvolvimento. **Sem PRD.**
- **Nina** — IA usada para suporte na comunidade. **Sem PRD.**

---

## Eventos de lead (CRM/GTM)

- `Lead_ie` — disparado por: Inteligência Empresarial
- `Lead_Imersao` — disparado por: Impulsão Empresarial
- `MQL` — disparado por: Legado Empresarial

---

## Notas sobre confusões comuns em transcrição

Produtos com **nomes similares** que costumam ser confundidos pela IA na transcrição:

| Confusão | Diferença |
|---|---|
| **Imersão Empresarial** vs **Imersão In Company** | Empresarial = turma aberta R$ 1.497. In Company = exclusiva R$ 45.000. Ambas focam em IA / Vibe Coding. |
| **Imersão IA In Company** (R$ 45k, 3 dias) vs **InCompany Completa** (R$ 180k, 12-15 semanas) | A IA é só de IA; a InCompany é o método Legacy inteiro com executor dedicado. |
| **Legacy Plan** vs **LegacyFin** | Plan = plataforma de executoria com mentoria + IA. Fin = fintech standalone só financeiro. |
| **Análise Tributária Inteligente** = **Legacy Tributos** | Mesmo produto, nomes diferentes em contextos diferentes. |
| **Luma Agent** | NÃO é produto separado — é módulo do Legacy Plan. |

Ver também `equipe.md` (seção "Variações comuns de transcrição") para correções de nomes de pessoas e do nome "Legacy" em si.
