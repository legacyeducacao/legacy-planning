# Design System Document: The Voice-First Monolith

> Clone do sistema visual de **elevenlabs.io**, adaptado como referência implementável para este projeto.

## 1. Overview & Creative North Star

**Creative North Star: The Sound Studio**
Este sistema toma emprestada a estética da ElevenLabs: um ambiente minimalista, quase silencioso, onde o produto é a voz e a interface se cala para que a tecnologia fale. A persona é a de um **estúdio de som premium**: paredes brancas, tipografia monumental, e uma única "luz quente" (o CTA preto) que orienta o olhar.

O sistema rejeita ornamentos. Cor é usada com parcimônia — quase tudo é preto, branco e cinza. Quando aparece cor, é em **gradientes vivos confinados a artefatos de produto** (formas de onda, orbs, ilustrações), nunca espalhada pela cromia da interface. O resultado é "Editorial Silencioso": uma página que respira como um livro de arte, mas se move como um sintetizador.

---

## 2. Colors: Monocromia Editorial + Gradientes Confinados

A paleta é deliberadamente curta. A regra é: **chrome neutro na interface, cor só dentro dos artefatos visuais**.

### Tokens Base (Light Mode — site institucional)

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#FFFFFF` | Fundo padrão da página. |
| `bg-subtle` | `#FAFAFA` | Faixas alternadas, separação por tom. |
| `bg-muted` | `#F4F4F5` | Cards passivos, áreas de leitura. |
| `fg` | `#0A0A0A` | Texto primário (quase preto, nunca `#000`). |
| `fg-muted` | `#52525B` | Texto secundário, descrições. |
| `fg-subtle` | `#A1A1AA` | Metadata, captions, labels desativadas. |
| `border` | `#E4E4E7` | Bordas hairline (1px). Usar com moderação. |
| `border-strong` | `#D4D4D8` | Bordas de inputs em foco/hover. |

### Tokens Base (Dark Mode — produto/app)

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#0A0A0A` | Fundo do app, painel principal. |
| `bg-subtle` | `#111113` | Painéis adjacentes, sidebar. |
| `bg-muted` | `#18181B` | Cards elevados, modais. |
| `fg` | `#FAFAFA` | Texto primário. |
| `fg-muted` | `#A1A1AA` | Texto secundário. |
| `fg-subtle` | `#52525B` | Placeholders, hints. |
| `border` | `rgba(255,255,255,0.08)` | Bordas hairline; **sempre via opacidade**, nunca cinza sólido. |
| `border-strong` | `rgba(255,255,255,0.14)` | Foco, estados ativos. |

### Accent / CTA

Diferente de SaaS que recorre a azul, **a marca é monocromática preta**. O "azul" é substituído por:

| Token | Hex | Uso |
|---|---|---|
| `accent` | `#0A0A0A` (light) / `#FAFAFA` (dark) | Botões primários, links em hover. |
| `accent-fg` | `#FFFFFF` (light) / `#0A0A0A` (dark) | Texto sobre o accent. |

### Gradientes Confinados (Product Artwork Only)

Reservados para **formas de onda, orbs, hero illustrations e voice cards** — nunca para fundos de seção inteiros ou botões da UI.

- **Aurora:** `linear-gradient(135deg, #FF6B9D 0%, #C46BFF 50%, #6B9DFF 100%)` — usado em hero spheres e visualizações de áudio.
- **Spectrum:** `linear-gradient(90deg, #00D4FF 0%, #7B2CFF 50%, #FF2C9C 100%)` — barras de waveform, equalizadores.
- **Ember:** `radial-gradient(circle, #FFB06B 0%, #FF5C5C 100%)` — orbs de "voz quente" / clones emocionais.

**Regra de Ouro:** Se um gradiente está no chrome (header, botão, card de UI), está errado. Gradiente é conteúdo, não invólucro.

---

## 3. Typography: Monumental Sans

Uma única família sans-serif geométrica carrega toda a hierarquia. A ElevenLabs usa uma fonte custom estilo Söhne/GT America — clones open-source aceitáveis:

- **Primary:** [Inter](https://rsms.me/inter/) ou [Geist](https://vercel.com/font) — geométrica, neutra, otimizada para tela.
- **Mono (opcional, para code/tokens):** [Geist Mono](https://vercel.com/font) ou [JetBrains Mono].

### Escala (clamp-fluid)

| Role | Tamanho | Peso | Tracking | Line-height |
|---|---|---|---|---|
| `display-2xl` | `clamp(64px, 9vw, 128px)` | 600 (Semibold) | `-0.04em` | `0.95` |
| `display-xl` | `clamp(48px, 6vw, 88px)` | 600 | `-0.035em` | `1.0` |
| `display-lg` | `clamp(40px, 5vw, 64px)` | 600 | `-0.03em` | `1.05` |
| `headline-lg` | `40px` | 600 | `-0.025em` | `1.1` |
| `headline-md` | `32px` | 600 | `-0.02em` | `1.15` |
| `headline-sm` | `24px` | 600 | `-0.015em` | `1.2` |
| `title-md` | `20px` | 500 (Medium) | `-0.01em` | `1.3` |
| `body-lg` | `18px` | 400 | `0` | `1.55` |
| `body-md` | `16px` | 400 | `0` | `1.6` |
| `body-sm` | `14px` | 400 | `0` | `1.55` |
| `label-md` | `13px` | 500 | `+0.01em` | `1.4` |
| `caption` | `12px` | 500 | `+0.02em` | `1.4` |

### Regras Tipográficas

- **Hero em peso Semibold (600), nunca Bold (700).** Bold soa "marketing"; Semibold soa "editorial".
- **Tracking negativo cresce com o tamanho.** Display-2xl em `-0.04em`; body em `0`. Isso recria a densidade "imprensa premium".
- **Tipografia como arte.** Em landing pages, deixe um `display-xl` ocupar 60-80% da largura, sozinho, com 160px de espaço acima e abaixo. Não preencha o silêncio.
- **Nunca centralize parágrafos longos.** Hero pode ser centralizado; corpo de texto sempre alinhado à esquerda.

---

## 4. Layout & Spacing: O Silêncio Estruturado

### Container

- **Max-width padrão:** `1280px` (`max-w-7xl`).
- **Padding lateral:** `clamp(24px, 5vw, 80px)`.
- **Section gap vertical:** `clamp(96px, 12vw, 200px)` entre seções de marketing. Sim, é muito. É proposital.

### Escala de Espaçamento

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 160 / 200`

### Padrões de Composição

- **Alinhamento à esquerda, dominante.** Heros, headlines de seção, parágrafos — quase tudo flush-left. Centralizar é exceção, reservada a hero institucional.
- **Grid de duas colunas com peso desigual.** Texto em coluna estreita à esquerda (~40%), artefato visual à direita (~60%). Inverter alternadamente entre seções gera ritmo.
- **Logos em fileira monocromática.** "Confiado por X" → logos em cinza (`#A1A1AA`) ou pretos em escala uniforme, espaçados generosamente, sem caixas.

---

## 5. Elevation & Depth: Quase Plano

Sombras são quase invisíveis. Profundidade vem de **mudança de fundo** e **bordas hairline**, não de elevação.

- **Cards passivos:** sem sombra, sem borda. Apenas `bg-muted` sobre `bg`.
- **Cards interativos:** borda `1px solid border` + transição suave para `border-strong` no hover. Sombra opcional, muito leve:
  - `box-shadow: 0px 1px 2px rgba(0,0,0,0.04), 0px 4px 12px rgba(0,0,0,0.04);`
- **Modais / popovers:** sombra mais presente, ainda contida:
  - `box-shadow: 0px 8px 24px rgba(0,0,0,0.08), 0px 24px 64px rgba(0,0,0,0.12);`
- **Glassmorphism:** usar com extrema parcimônia, apenas em **floating audio player** ou comando flutuante:
  - `background: rgba(255,255,255,0.72); backdrop-filter: blur(24px) saturate(180%);`

---

## 6. Components

### Botões

Estilo dominante: **pill ou levemente arredondado** (`border-radius: 9999px` ou `12px`).

| Variante | Background | Texto | Borda | Hover |
|---|---|---|---|---|
| **Primary** | `fg` (`#0A0A0A`) | `bg` (`#FFFFFF`) | nenhuma | bg → `#262626` |
| **Secondary** | `bg` | `fg` | `1px solid border` | bg → `bg-muted` |
| **Ghost** | transparente | `fg` | nenhuma | bg → `bg-muted` |
| **Link** | nenhum | `fg` com sublinhado animado (`text-decoration-thickness: 1px; offset: 4px`) | — | offset cresce para 6px |

- **Padding:** `12px 24px` (md), `16px 32px` (lg).
- **Peso de fonte no botão:** 500 (Medium), nunca Bold.
- **Ícones:** seta `→` à direita em CTAs ("Get started →"), com `transform: translateX(2px)` no hover.

### Navigation Bar

- Altura: `64px`.
- Fundo: `bg` com transição para `rgba(255,255,255,0.8)` + `backdrop-filter: blur(12px)` ao rolar.
- Links: `body-md`, peso 500, `fg-muted` em repouso, `fg` no hover.
- Sem bordas inferiores. Apenas o blur sinaliza fixação.

### Inputs

- Borda: `1px solid border`, radius `12px`, padding `14px 16px`.
- Foco: borda → `border-strong`, **sem ring colorido** (a UI é monocromática). Opcional: outline preto 2px com offset 2px.
- Placeholder: `fg-subtle`.
- Em dark mode: usar a borda translúcida (`rgba(255,255,255,0.08)`), nunca cinza sólido.

### Cards

- Radius: `16px` (cards padrão), `24px` (feature cards de produto).
- Sem sombra por padrão.
- Padrão hover para cards clicáveis: leve `translateY(-2px)` em 200ms e borda → `border-strong`.
- **Voice Card (signature component):**
  - Avatar circular 56px, nome em `title-md`, descrição em `body-sm fg-muted`.
  - Botão play circular 40px à direita, fundo `fg`, ícone branco.
  - Waveform mini abaixo do nome, gradiente `Spectrum`, altura 24px.

### Waveform / Audio Visualizer

Elemento de assinatura. Barras verticais, gap 2px, animação random com `cubic-bezier(0.4, 0, 0.2, 1)`. Quando em playback ativo, animar; em repouso, estática em 30% de altura média. Usar `Spectrum` gradient mascarado.

### Badges / Chips

- Pill (`9999px`), padding `4px 10px`, `caption` size.
- "New" / version badges: fundo `bg-muted`, borda `1px solid border`, texto `fg-muted`.
- Status "Live": ponto verde `#22C55E` 6px + texto.

### Tables

- Sem zebra-striping. Apenas linhas de separação `1px solid border` entre rows.
- Header: `label-md`, uppercase, `fg-muted`.
- Cell padding: `16px 20px`.

---

## 7. Motion: Discreto e Pesado

- **Transição padrão:** `200ms cubic-bezier(0.4, 0, 0.2, 1)`.
- **Page-enter:** fade-in + slide-up 12px, stagger de 60ms entre elementos do hero.
- **Hover micro:** translate 2px, opacidade 0.85 — nunca scale > 1.02.
- **Waveform:** loop infinito, mas pausa em `prefers-reduced-motion`.
- **Não usar:** parallax exagerado, bounce springs, rotações decorativas.

---

## 8. Do's and Don'ts

### Do
- **Do** deixar grandes áreas em branco. Se a seção parece "vazia demais", está quase certa.
- **Do** confinar cor a artefatos (waveforms, orbs, ilustrações de produto). Tudo o resto é P&B.
- **Do** usar Semibold (600), não Bold (700), em headlines. Soa editorial, não vendedor.
- **Do** alinhar à esquerda por padrão. Centralizar só hero.
- **Do** usar borda `1px solid #E4E4E7` quando precisar separar — é a única "linha" permitida, e deve ser quase invisível.

### Don't
- **Don't** usar `#000000` em texto. Use `#0A0A0A`. Preto puro vibra desagradavelmente em tela.
- **Don't** colorir botões. CTA é preto sobre branco (ou branco sobre preto em dark mode). Acabou.
- **Don't** aplicar gradiente em background de página, header ou botão. Gradiente vive dentro do produto, nunca no chrome.
- **Don't** usar sombras pesadas. Se a sombra é a primeira coisa que você nota, é pesada demais.
- **Don't** comprimir o vertical rhythm. 96-160px entre seções é o mínimo, não o máximo.
- **Don't** misturar mais de uma família tipográfica. Uma sans para tudo.

---

## 9. Tokens (CSS Variables — pronto para copiar)

```css
:root {
  /* Surfaces — Light */
  --bg: #FFFFFF;
  --bg-subtle: #FAFAFA;
  --bg-muted: #F4F4F5;

  /* Foreground — Light */
  --fg: #0A0A0A;
  --fg-muted: #52525B;
  --fg-subtle: #A1A1AA;

  /* Borders — Light */
  --border: #E4E4E7;
  --border-strong: #D4D4D8;

  /* Accent */
  --accent: #0A0A0A;
  --accent-fg: #FFFFFF;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 9999px;

  /* Shadow */
  --shadow-sm: 0px 1px 2px rgba(0,0,0,0.04), 0px 4px 12px rgba(0,0,0,0.04);
  --shadow-lg: 0px 8px 24px rgba(0,0,0,0.08), 0px 24px 64px rgba(0,0,0,0.12);

  /* Motion */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dur: 200ms;
}

[data-theme="dark"] {
  --bg: #0A0A0A;
  --bg-subtle: #111113;
  --bg-muted: #18181B;
  --fg: #FAFAFA;
  --fg-muted: #A1A1AA;
  --fg-subtle: #52525B;
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.14);
  --accent: #FAFAFA;
  --accent-fg: #0A0A0A;
}
```
