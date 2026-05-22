# Handoff · Legacy Planning · Login & Logo

## Overview

Tela de login para **Legacy Planning** (planejador de reuniões, transcritor, gerador de atas e próximos passos). A direção final é a **variação D · Cream + Dark Card** — desenhada pra falar a mesma língua visual da home/dashboard já existente, criando uma transição visual coesa entre login → app.

O pacote inclui:
- 1 logo (**Convene**) em SVG inline + wordmark "LEGACY PLANNING"
- 1 tela de login na variação D (cream canvas + dark card)

## About the Design Files

Os arquivos `.html` e `.jsx` deste pacote são **referências de design feitas em HTML/React** — protótipos mostrando o look-and-feel pretendido. **Não são código de produção.**

A tarefa é **recriar este design no seu codebase** usando o framework e as convenções já estabelecidas (Next.js / Vite / Remix / Angular / Vue / SwiftUI / etc.). Se o app ainda não tem framework, escolha o que faz mais sentido e implemente lá. **Não copie o HTML cru.**

## Fidelity

**High-fidelity (hifi).** Todos os valores (cores, tipografia, espaçamentos, raios, sombras, copy) são finais e devem ser replicados com fidelidade pixel-perfect dentro das primitivas do seu codebase.

---

## Logo · Convene

### Conceito
Três pontos nos vértices de um triângulo equilátero, conectados por linhas finas. Lê como **reunião** — três participantes em alinhamento — e mantém o triângulo do branding como ícone-base.

### Especificação SVG (44×44 viewBox)
```svg
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-label="Legacy Planning">
  <!-- conexões -->
  <path d="M22 9 L37 35 L7 35 Z"
        stroke="currentColor" stroke-width="1.4" opacity="0.4"
        stroke-linejoin="round" />
  <!-- vértices -->
  <circle cx="22" cy="9"  r="3.6" fill="var(--accent)" />
  <circle cx="37" cy="35" r="3.6" fill="var(--accent)" />
  <circle cx="7"  cy="35" r="3.6" fill="var(--accent)" />
</svg>
```

- **Cor das linhas**: `currentColor` no fundo (40% de opacidade)
- **Cor dos pontos**: `var(--accent)` — ver tokens abaixo
- **Tamanhos suportados**: 16, 20, 24, 32, 44, 64, 96px
- **Versão sobre dark**: pontos em `--accent-2` (mais claro) — ver tokens

### Wordmark (lock-up)
- Logo + texto "LEGACY PLANNING" lado a lado
- Tipografia: **Inter** weight 600, `letter-spacing: 0.04em`, `text-transform: uppercase`
- Texto a ~21px quando o ícone é 44px (escala proporcional)
- Gap ícone↔texto: `14px`
- Versão **stacked** (texto em duas linhas) disponível, com Inter 700, `letter-spacing: 0.02em`, `line-height: 0.98`

---

## Login · Cream + Dark Card (variação D)

**Purpose**: autenticar o usuário (e-mail + senha) ou solicitar acesso. SSO via Google disponível.

### Design rationale

Esta tela é deliberadamente desenhada pra continuar a linguagem visual da home/dashboard:

| Elemento da home | Repetido no login |
|---|---|
| Canvas cream `#f4efe3` | Background da página |
| Sidebar / cards dark navy `#0e1118` | Card do formulário |
| Headline Inter Extrabold 2 linhas, 2ª linha em royal blue | Headline "Sua reunião começa aqui. / Tudo no seu nome." |
| `# planner ai · ativo agora` (mono) | `# entrar · aurora ativa`, `# copyright 2026`, etc. |
| Stats top-right da home | Stats abaixo do headline (28h / 98% / 1:1) |
| Royal blue `#3654ff` como accent | CTAs, tab ativa, headline accent |

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ [▲ LEGACY PLANNING]              não tem conta?  [Solicitar]│ ← top bar
├────────────────────────────────────────────────────────────┤
│                                                            │
│  # entrar · aurora ativa             ┌──────────────────┐  │
│                                      │ # entrar         │  │
│  Sua reunião começa aqui.            │                  │  │
│  Tudo no seu nome.   ← em royal blue │ Bem-vindo de     │  │
│                                      │ volta, Lair.     │  │
│  Acesse pra abrir sua agenda…        │                  │  │
│                                      │ [Entrar][Solic.] │  │
│  ─────────────────────────           │                  │  │
│  28h    98%    1:1                   │ E-MAIL  [...]    │  │
│  economizadas  acurácia  pdi·pop     │ SENHA   [...]    │  │
│                                      │ ☑ Lembrar-me     │  │
│                                      │ [    ENTRAR    ] │  │
│                                      │  ou              │  │
│                                      │ [ G Entrar Google│  │
│                                      └──────────────────┘  │
├────────────────────────────────────────────────────────────┤
│ # copyright 2026 — legacy educação    suporte status priv  │ ← bottom bar
└────────────────────────────────────────────────────────────┘
```

- Base: **1440×900** (deve ser responsivo)
- Grid de 2 colunas em desktop: `1.15fr 0.85fr` com `gap: 64px`, `padding: 56px 64px`
- < 1024px: empilhar (card vai abaixo do headline), reduzir paddings
- < 640px: card ocupa toda largura, esconder stats

### Top bar

- Padding: `24px 48px`
- Border-bottom: `1px solid rgba(14, 17, 24, 0.1)`
- Background: cream
- **Esquerda**: Wordmark Convene + "LEGACY PLANNING" (cor `--ink`)
- **Direita**: texto mono `"não tem conta?"` + botão outline `"Solicitar acesso →"`
  - Botão: `padding: 8px 14px`, `border-radius: 9999px`, `border: 1.5px solid var(--ink)`
  - Hover: inverte para fundo navy + texto branco

### Coluna esquerda (pitch)

**Tag superior**:
- Mono `13px` cor mutada
- Prefixo: símbolo `✱` em royal blue + espaço
- Texto: `# entrar · aurora ativa`
- Margin-bottom: 28px

**Headline**:
- Inter weight **800**, **62px**, `line-height: 1.0`, `letter-spacing: -0.04em`
- Cor: `--ink` (#0e1118)
- Max-width: 640px
- Duas frases:
  1. `Sua reunião começa aqui.` — cor base (escura)
  2. `Tudo no seu nome.` — wrapped em `<em>` mas com `font-style: normal` e `color: var(--accent)`. **NÃO usar itálico.**

**Lede**:
- 17px, `line-height: 1.55`, cor `--muted` (#595e6a)
- Max-width: 480px
- Margin: `0 0 48px`
- Texto: `Acesse pra abrir sua agenda do dia, conferir as transcrições da semana e seguir os próximos passos pendentes da equipe.`

**Stats** (linha de 3, `gap: 56px`, com `border-top: 1px solid rgba(14,17,24,0.1)`, `padding-top: 28px`):

| Valor | Label |
|---|---|
| `28h` | `economizadas /mês` |
| `98%` | `acurácia (pt-br)` |
| `1:1` | `pdi · pop · reuniões` |

- Valor: Inter 800, **36px**, `line-height: 1`, `letter-spacing: -0.03em`, cor `--ink`
- Label: **JetBrains Mono** 11px, cor `--soft` (#8a8e98), lowercase

### Coluna direita (form card)

**Container**:
- Background: `#0e1118` (navy idêntico aos cards da home)
- Cor texto: branco
- `border-radius: 20px`
- `padding: 40px`
- `box-shadow: 0 30px 60px -30px rgba(14, 17, 24, 0.4)`
- Max-width: 480px, alinhado ao final (`justify-self: end`)

**Tag do card** (acima do título):
- Mono 13px, prefixado por `# ` (mais claro)
- Cor: `rgba(255,255,255,0.45)`
- Texto: `entrar` (com `# ` adicionado via `::before`)
- Margin-bottom: 16px

**Título do card**:
- Inter weight **700**, **30px**, `line-height: 1.1`, `letter-spacing: -0.03em`
- Duas linhas:
  1. `Bem-vindo de volta,` — branco
  2. `Lair.` — em `<em>` (sem itálico), cor `--accent`
- Substitua "Lair" pelo primeiro nome do usuário autenticado. Fallback: `Bem-vindo de volta.` (sem o nome).

**Sub do card**:
- 14px, `rgba(255,255,255,0.55)`, margin-bottom 28px
- Texto: `Vamos abrir sua agenda de hoje.`

**Tabs "Entrar / Solicitar acesso"**:
- Grid `1fr 1fr`, container `padding: 4px`, `border-radius: 12px`
- Background container: `rgba(255,255,255,0.05)`
- Cada tab: altura 40px, `border-radius: 9px`
- Tab ativa: background = `--accent`, texto branco, `box-shadow: 0 4px 14px rgba(54,84,255,0.4)`
- Tab inativa: transparente, texto `rgba(255,255,255,0.45)`
- Tipografia: Inter 700, 12px, `letter-spacing: 0.12em`, uppercase
- Margin-bottom: 24px

**Campos**:
- Label: Inter 600, 11px uppercase, `letter-spacing: 0.12em`, cor `rgba(255,255,255,0.5)`
- Input wrap: altura 50px, `border-radius: 12px`, `padding: 0 16px`, gap 12px
- Background: `rgba(255,255,255,0.04)`. Focus: `rgba(255,255,255,0.08)`
- Border `1.5px` em `rgba(255,255,255,0.08)`. Focus: border `--accent`, ring `0 0 0 4px rgba(54,84,255,0.28)`
- Ícone à esquerda (mail/lock), opacidade 55%
- Input: Inter 400, 15px, cor branca, placeholder `rgba(255,255,255,0.4)`
- Senha tem ícone olho à direita (toggle visibility)
- Margin entre campos: 16px

**Linha · Lembrar-me / Esqueci a senha**:
- Flex space-between, margin `18px 0 24px`
- Checkbox custom 18×18, `border-radius: 5px`, fundo `--accent` quando ligado (✓ branco), borda `1.5px rgba(255,255,255,0.3)` quando off
- Texto "Lembrar-me": 13px, `rgba(255,255,255,0.65)`
- Link "Esqueci a senha": 13px, `rgba(255,255,255,0.7)`

**Botão primário "ENTRAR"**:
- Width 100%, altura 52px
- **`border-radius: 9999px` (pill)**
- Background: `--accent` sólido (royal blue `#3654ff`)
- Hover: mix com 10% de branco, `box-shadow: 0 10px 24px -10px rgba(54,84,255,0.5)`
- Conteúdo: ícone escudo (14px) + `ENTRAR` (Inter 600, 14px, `letter-spacing: 0.08em`, uppercase, branco)

**Divisor "ou"**:
- Margin `18px 0`
- Linhas dos dois lados em `rgba(255,255,255,0.1)`
- Texto "ou": Inter 600, 11px uppercase, `letter-spacing: 0.16em`, `rgba(255,255,255,0.35)`

**Botão Google**:
- Width 100%, altura 50px, **`border-radius: 9999px` (pill)**
- Background `rgba(255,255,255,0.06)`, border `1.5px rgba(255,255,255,0.1)`, texto branco
- Hover: background `rgba(255,255,255,0.1)`
- Conteúdo: logo Google colorido (18px) + `Entrar com Google` (Inter 500, 14px)

### Bottom bar

- Padding: `18px 48px`
- Border-top: `1px solid rgba(14,17,24,0.1)`
- Background cream
- Tipografia: JetBrains Mono 12px, cor `--soft`
- **Esquerda**: `# copyright 2026 — legacy educação`
- **Direita** (gap 24px): `suporte` / `status` / `privacidade`

---

## Interactions & Behavior

### Tabs
- Clique em `Solicitar acesso` troca a tab. Formulário interno pode mostrar campos diferentes (nome, e-mail corporativo, motivo). **Fluxo de Solicitar acesso não está mockado** — definir com produto.

### Mostrar/esconder senha
- Ícone olho à direita do campo senha alterna `input.type` entre `password` ↔ `text`.

### Lembrar-me
- Quando ligado, persiste o e-mail (não a senha) em cookie/localStorage por 30 dias.

### Login com Google
- Inicia fluxo OAuth do provedor já configurado no backend (fora do escopo deste design).

### Validação
- E-mail: regex check on blur. Se inválido, borda fica `--error` e mensagem 12px aparece abaixo.
- Senha: min 8 chars (validar só ao submeter).
- Botão "Entrar" mostra loading state (spinner branco no lugar do escudo, texto vira `ENTRANDO…`) durante request.
- Erro 401: mensagem `Credenciais inválidas` abaixo do botão, cor `--error`.

### Transições
- Hover botão primário: `transform 120ms ease`, `box-shadow 140ms ease`
- Hover botão outline "Solicitar acesso": `background 140ms ease`, `color 140ms ease`
- Focus inputs: `border-color 140ms ease`, `background 140ms ease`, `box-shadow 140ms ease`
- Tab swap: `all 160ms ease`

---

## State Management

```ts
type LoginState = {
  tab: 'entrar' | 'solicitar';
  email: string;
  password: string;
  remember: boolean;
  passwordVisible: boolean;
  submitting: boolean;
  errors: { email?: string; password?: string; form?: string };
};
```

Fluxo de submissão:
1. Validar localmente (email regex, password length)
2. Se ok, `submitting = true`, chamar API de auth
3. Sucesso: redirecionar para a home/dashboard (`/inicio` ou similar)
4. Erro 401: popular `errors.form` com `Credenciais inválidas`
5. Erro de rede: toast `Não foi possível conectar. Tente novamente.`

---

## Design Tokens

### Cores (alinhadas com a home)

```css
/* Brand & accent */
--brand-accent:     #3654ff;            /* royal blue — CTAs, links, headline accent, focus */
--brand-accent-2:   #3654ff;            /* same em LoginD; reservado pra hover/dark variant */
--brand-ring:       rgba(54, 84, 255, 0.28);
--brand-accent-soft:rgba(54, 84, 255, 0.12);

/* Surface (light/cream) */
--canvas:           #f4efe3;            /* cream — bg principal, igual à home */
--ink:              #0e1118;            /* navy quase preto — sidebar, cards, headlines */
--ink-2:            #1a1f2e;
--muted:            #595e6a;            /* lede, secondary text */
--soft:             #8a8e98;            /* mono labels, copyright */
--hairline:         rgba(14, 17, 24, 0.1);

/* Dark card (inside the form) */
--card-bg:          #0e1118;
--card-input-bg:    rgba(255, 255, 255, 0.04);
--card-input-focus: rgba(255, 255, 255, 0.08);
--card-border:      rgba(255, 255, 255, 0.08);
--card-ink:         #ffffff;
--card-ink-muted:   rgba(255, 255, 255, 0.55);
--card-ink-soft:    rgba(255, 255, 255, 0.4);

/* Semânticas */
--error:   #cf2d56;
--success: #1f8a65;
```

### Espaçamento

Base 4px. Tokens usados:
```
xs:  8px
sm: 12px
md: 16px
lg: 24px
xl: 32px
2xl:40px
3xl:48px
4xl:56px
5xl:64px
```

### Raios

```
sm:    6px
md:    9px   (tabs internas)
lg:   12px   (inputs, container de tabs)
xl:   20px   (form card)
pill: 9999px (CTA Entrar, botão Google, botão Solicitar acesso, status dots)
```

### Sombras

```css
--shadow-card:      0 30px 60px -30px rgba(14, 17, 24, 0.4);
--shadow-btn-hover: 0 10px 24px -10px rgba(54, 84, 255, 0.5);
--shadow-tab-active:0 4px 14px rgba(54, 84, 255, 0.4);
```

### Tipografia

Famílias:
- **Inter** (Google Fonts) — display + body. Pesos 300, 400, 500, 600, 700, 800
- **JetBrains Mono** (Google Fonts) — labels mono, copyright, stat labels. Pesos 400, 500

| Token | Font | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| display-xl | Inter | 62px | 800 | 1.0 | -0.04em |
| display-md | Inter | 30px | 700 | 1.1 | -0.03em |
| stat-num | Inter | 36px | 800 | 1.0 | -0.03em |
| body-lg | Inter | 17px | 400 | 1.55 | — |
| body | Inter | 15px | 400 | 1.5 | — |
| body-sm | Inter | 14px | 400 | 1.5 | — |
| body-xs | Inter | 13px | 400 | 1.5 | — |
| label-upper | Inter | 11px | 600 | 1.4 | 0.12em, uppercase |
| button | Inter | 14px | 600 | 1.0 | 0.08em, uppercase |
| mono-13 | JetBrains Mono | 13px | 400 | 1.4 | — |
| mono-12 | JetBrains Mono | 12px | 400 | 1.4 | — |
| mono-11 | JetBrains Mono | 11px | 400 | 1.4 | — |

Habilitar font-feature-settings `"ss01"` globalmente.

---

## Assets

### Ícones
Todos do conjunto **Lucide** (ou recriados como SVG inline):

| No design | Lucide |
|---|---|
| Envelope (e-mail) | `mail` |
| Cadeado (senha) | `lock` |
| Olho (toggle senha) | `eye` |
| Escudo (botão Entrar) | `shield` |
| Seta direita | `arrow-right` |
| Check (checkbox) | `check` |

Stroke-width: `1.8` para 18-24px, `2` para 14-16px.

### Logo Google
Usar SVG oficial colorido do Google Sign-In. **Não recolorir.**

### Logo Convene
Inline no código (SVG dentro do componente). Não embutir como `<img>`.

### Fontes
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```
Em produção, self-host com `@fontsource/inter` e `@fontsource/jetbrains-mono`.

---

## Files

Arquivos de referência neste handoff:

- **`screenshots/`** — capturas do design final:
  - `01-login-final.png` — Login D (direção escolhida)
  - `02-logo-convene.png` — galeria dos 3 conceitos de logo (implementar **somente Convene**)
- `Legacy Planning Login.html` — entrypoint do canvas de design (não é a tela final, é o canvas com várias variações)
- `legacy/styles.css` — todos os tokens e estilos. **Foque nas regras `.lp-d`** (a direção final). Regras `.lp-a`, `.lp-b`, `.lp-c` são explorações descartadas — ignore.
- `legacy/logos.jsx` — componentes React de logo. **Foque em `LogoConvene` e `LegacyWordmark`**.
- `legacy/logins.jsx` — componentes React de login. **Foque em `LoginD`**, que aceita props `logoVariant` e `palette`. Use também o componente compartilhado `LoginFields` (campos de e-mail, senha, lembrar-me, etc.) e o objeto `Icon` (SVG inline).

---

## Checklist de implementação

- [ ] Tokens de cor adicionados (CSS vars, Tailwind config, ou equivalente)
- [ ] Fontes Inter + JetBrains Mono carregadas
- [ ] Componente `<Logo size>` (Convene) inline SVG
- [ ] Componente `<Wordmark stacked color accent>` (logo + texto)
- [ ] Componente `<Input>` reutilizável (label uppercase + ícone + focus ring) — light e dark variants
- [ ] Componente `<Button>` primário pill + outline pill
- [ ] Componente `<Checkbox>` custom
- [ ] Página `<LoginPage>` com layout split (pitch + dark card)
- [ ] Tabs Entrar / Solicitar acesso (formulário de Solicitar a definir com produto)
- [ ] Validação + estados de erro/loading
- [ ] Integração com auth backend
- [ ] Responsividade < 1024px (empilhar) e < 640px (mobile)
- [ ] Testes de a11y (foco visível, labels ARIA, contraste mínimo 4.5:1)
- [ ] Smoke test visual: a tela de login + a home/dashboard devem parecer "do mesmo lugar" (mesma família tipográfica, mesmo accent, mesmos cards dark)
