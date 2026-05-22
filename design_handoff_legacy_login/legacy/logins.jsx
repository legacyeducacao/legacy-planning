// Three login variations for Legacy Planning + a logo gallery artboard.
// All read `logoVariant` and `palette` from props so Tweaks can swap live.

const Icon = {
  mail: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  lock: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  eye: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  shield: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4 6v6c0 4 3.5 7.5 8 9 4.5-1.5 8-5 8-9V6l-8-3Z" />
    </svg>
  ),
  google: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.16c-.27 1.4-1.07 2.59-2.28 3.39v2.82h3.68C21.7 18.74 23 15.77 23 12.27Z" />
      <path fill="#34A853" d="M12 24c3.08 0 5.66-1.02 7.55-2.78l-3.68-2.82c-1.02.68-2.32 1.09-3.87 1.09-2.97 0-5.49-2-6.39-4.69H1.83v2.92A11.5 11.5 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.61 14.8a6.78 6.78 0 0 1 0-4.32V7.56H1.83a11.5 11.5 0 0 0 0 10.16l3.78-2.92Z" />
      <path fill="#EA4335" d="M12 4.77c1.68 0 3.18.58 4.36 1.7l3.27-3.27C17.65 1.24 15.07 0 12 0 7.6 0 3.82 2.55 1.83 6.27l3.78 2.92C6.51 6.5 9.03 4.77 12 4.77Z" />
    </svg>
  ),
  arrowRight: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  check: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  ),
};

/* Shared form-fields component used by all three variations */
const LoginFields = ({ email = "lair.rodrigo@gmail.com", showPw = false }) => {
  const [tab, setTab] = React.useState("entrar");
  const [remember, setRemember] = React.useState(true);
  const [pwVisible, setPwVisible] = React.useState(showPw);
  return (
    <>
      <div className="lp-tabs">
        <button className={`lp-tab ${tab === "entrar" ? "is-active" : ""}`} onClick={() => setTab("entrar")}>Entrar</button>
        <button className={`lp-tab ${tab === "solicitar" ? "is-active" : ""}`} onClick={() => setTab("solicitar")}>Solicitar acesso</button>
      </div>

      <div className="lp-field" style={{ marginBottom: 16 }}>
        <label className="lp-field-label">E-mail</label>
        <div className="lp-field-input">
          <span className="lp-field-icon">{Icon.mail()}</span>
          <input type="email" defaultValue={email} />
        </div>
      </div>

      <div className="lp-field">
        <label className="lp-field-label">Senha</label>
        <div className="lp-field-input">
          <span className="lp-field-icon">{Icon.lock()}</span>
          <input type={pwVisible ? "text" : "password"} defaultValue="••••••••" />
          <button
            onClick={() => setPwVisible(v => !v)}
            style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", opacity: 0.6, padding: 4 }}
            aria-label="Mostrar senha"
          >
            {Icon.eye()}
          </button>
        </div>
      </div>

      <div className="lp-a-row">
        <label className="lp-checkbox" onClick={() => setRemember(v => !v)}>
          <span className={`lp-checkbox-box ${remember ? "" : "off"}`}>
            {remember ? Icon.check() : null}
          </span>
          <span style={{ fontSize: 13, color: "var(--lp-label, #6e7891)" }}>Lembrar-me</span>
        </label>
        <a href="#" className="lp-link">Esqueci a senha</a>
      </div>

      <button className="lp-btn-primary">
        {Icon.shield(14)}
        Entrar
      </button>

      <div className="lp-or">ou</div>

      <button className="lp-btn-google">
        {Icon.google()}
        Entrar com Google
      </button>
    </>
  );
};

/* ===================================================================
   VARIATION A — REFINED NAVY
   =================================================================== */
const LoginA = ({ logoVariant = "peaks", palette = "navy" }) => {
  return (
    <div className="lp-a" data-palette={palette}>
      <aside className="lp-a-hero">
        <svg className="lp-bg-tri" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="trA" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d="M460 60 L640 580 L280 580 Z" stroke="url(#trA)" strokeWidth="1" fill="none" />
          <path d="M420 140 L560 540 L280 540 Z" stroke="url(#trA)" strokeWidth="1" fill="none" />
          <path d="M380 220 L480 500 L280 500 Z" stroke="url(#trA)" strokeWidth="1" fill="none" />
          <path d="M120 640 L280 980 L-40 980 Z" stroke="url(#trA)" strokeWidth="1" fill="none" />
          <path d="M160 720 L240 920 L80 920 Z" stroke="url(#trA)" strokeWidth="1" fill="none" />
        </svg>
        <div className="lp-a-mark">
          <LegacyWordmark variant={logoVariant} color="#fff" accent="var(--lp-accent-2)" scale={1} />
        </div>
        <div className="lp-a-hero-bottom">
          <h1 className="lp-a-title">
            Cada reunião<br />
            vira <em>legado.</em>
          </h1>
          <p className="lp-a-sub">
            Planeje 1:1s e POPs, transcreva no automático e saia com a ata pronta e os próximos passos atribuídos.
          </p>
          <div className="lp-a-features">
            <div className="lp-a-feature"><span className="lp-a-feature-dot" />Calendário, 1:1, PDI e POP em um só lugar</div>
            <div className="lp-a-feature"><span className="lp-a-feature-dot" />Transcrição com identificação de quem falou</div>
            <div className="lp-a-feature"><span className="lp-a-feature-dot" />Ata e tarefas geradas ao fim da reunião</div>
          </div>
        </div>
      </aside>

      <main className="lp-a-form">
        <div className="lp-a-form-inner">
          <h2 className="lp-a-welcome">Seja bem-vindo</h2>
          <p className="lp-a-welcome-sub">Acesse o sistema com suas credenciais Legacy.</p>
          <LoginFields />
          <p style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: "#97a2b7" }}>
            Copyright 2026 — Legacy Educação
          </p>
        </div>
      </main>
    </div>
  );
};

/* ===================================================================
   VARIATION B — EDITORIAL CREAM
   =================================================================== */
const LoginB = ({ logoVariant = "peaks", palette = "ember" }) => {
  return (
    <div className="lp-b" data-palette={palette}>
      {/* corner triangles */}
      <svg className="lp-b-corner tl" width="320" height="320" viewBox="0 0 320 320" fill="currentColor">
        <path d="M160 20 L300 280 L20 280 Z" />
      </svg>
      <svg className="lp-b-corner br" width="380" height="380" viewBox="0 0 380 380" fill="currentColor">
        <path d="M190 40 L350 320 L30 320 Z" />
      </svg>

      <header className="lp-b-top">
        <LegacyWordmark variant={logoVariant} color="#1c1812" accent="var(--lp-accent)" stacked={false} />
        <div className="lp-b-status">
          <span className="lp-b-status-dot" />
          Todos os sistemas operacionais
        </div>
      </header>

      <div className="lp-b-main">
        <section>
          <div className="lp-b-headline-rule" />
          <h1 className="lp-b-headline">
            O que foi dito,<br />
            <em>fica feito.</em>
          </h1>
          <p className="lp-b-lede">
            Legacy Planning organiza suas reuniões, transcreve as conversas e
            transforma cada decisão em ata e próximos passos — sem você levantar
            a mão.
          </p>
          <div className="lp-b-quote">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--lp-accent)">
              <path d="M9 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a2 2 0 0 1-2 2H4v2h1a4 4 0 0 0 4-4V7Zm12 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a2 2 0 0 1-2 2h-1v2h1a4 4 0 0 0 4-4V7Z" />
            </svg>
            <div>
              <p className="lp-b-quote-text">
                "A gente saiu da reunião com a ata pronta. Antes isso levava um dia inteiro."
              </p>
              <p className="lp-b-quote-attr">Renata Lopes — Gerente de Pessoas</p>
            </div>
          </div>
        </section>

        <section className="lp-b-card">
          <h2 className="lp-a-welcome" style={{ marginBottom: 4 }}>Bom te ver de novo</h2>
          <p className="lp-a-welcome-sub" style={{ marginBottom: 24 }}>Entre para abrir sua agenda de hoje.</p>
          <LoginFields />
        </section>
      </div>

      <footer className="lp-b-bottom-bar">
        <span>Copyright 2026 — Legacy Educação</span>
        <span style={{ display: "flex", gap: 18 }}>
          <a className="lp-link" href="#">Suporte</a>
          <a className="lp-link" href="#">Status</a>
          <a className="lp-link" href="#">Privacidade</a>
        </span>
      </footer>
    </div>
  );
};

/* ===================================================================
   VARIATION C — AURORA GLASS
   =================================================================== */
const LoginC = ({ logoVariant = "peaks", palette = "plum", theme = "dark" }) => {
  const isLight = theme === "light";
  const wordmarkColor = isLight ? "#0d1b3d" : "#fff";
  const accentColor = isLight ? "var(--lp-accent)" : "var(--lp-accent-2)";
  const footerColor = isLight ? "rgba(13,27,61,0.45)" : "rgba(255,255,255,0.4)";
  return (
    <div className="lp-c" data-palette={palette} data-theme={theme}>
      <div className="lp-c-aurora" />
      <div className="lp-c-grid" />
      <div className="lp-c-noise" />

      <div className="lp-c-shell">
        <div className="lp-c-left">
          <LegacyWordmark variant={logoVariant} color={wordmarkColor} accent={accentColor} stacked={false} />

          <div>
            <span className="lp-c-tag">
              <span className="lp-c-tag-dot" />
              Versão 4.2 · Transcrição em tempo real
            </span>
            <h1 className="lp-c-headline">
              Reuniões que<br />
              <em>se planejam,</em><br />
              se transcrevem<br />
              e se concluem.
            </h1>
            <p className="lp-c-sub">
              Planeje a pauta, deixe o Legacy transcrever a conversa, e receba a ata
              com os próximos passos atribuídos no fim. Para times de RH, gestão e PDI.
            </p>
            <div className="lp-c-stats">
              <div>
                <span className="lp-c-stat-val">28h</span>
                <span className="lp-c-stat-lbl">Economizadas / mês</span>
              </div>
              <div>
                <span className="lp-c-stat-val">98%</span>
                <span className="lp-c-stat-lbl">Acurácia (PT-BR)</span>
              </div>
              <div>
                <span className="lp-c-stat-val">1:1</span>
                <span className="lp-c-stat-lbl">PDI · POP · Reuniões</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: footerColor }}>
            Copyright 2026 — Legacy Educação · Todos os direitos reservados
          </div>
        </div>

        <aside className="lp-c-card">
          <h2 className="lp-c-welcome">Entrar</h2>
          <p className="lp-c-welcome-sub">Acesse sua conta para abrir a agenda de hoje.</p>
          <LoginFields />
        </aside>
      </div>
    </div>
  );
};

/* ===================================================================
   VARIATION D — HOME-MATCHED
   Matches the existing dashboard's vocabulary: cream canvas, royal blue
   accent, bold Inter display with blue accent on a second line, JetBrains
   Mono micro-labels, dark navy form card.
   =================================================================== */
const LoginD = ({ logoVariant = "convene", palette = "navy" }) => {
  return (
    <div className="lp-d" data-palette={palette}>
      <header className="lp-d-top">
        <LegacyWordmark variant={logoVariant} color="#0e1118" accent="var(--lp-d-accent)" stacked={false} />
        <div className="lp-d-top-right">
          <span className="lp-d-mono">não tem conta?</span>
          <a className="lp-d-link" href="#">
            Solicitar acesso
            {Icon.arrowRight(14)}
          </a>
        </div>
      </header>

      <main className="lp-d-main">
        <section className="lp-d-pitch">
          <span className="lp-d-tag"># entrar · aurora ativa</span>
          <h1 className="lp-d-headline">
            Sua reunião começa aqui.<br />
            <em>Tudo no seu nome.</em>
          </h1>
          <p className="lp-d-lede">
            Acesse pra abrir sua agenda do dia, conferir as transcrições da
            semana e seguir os próximos passos pendentes da equipe.
          </p>
          <div className="lp-d-stats">
            <div>
              <span className="lp-d-stat-val">28h</span>
              <span className="lp-d-stat-lbl">economizadas /mês</span>
            </div>
            <div>
              <span className="lp-d-stat-val">98%</span>
              <span className="lp-d-stat-lbl">acurácia (pt-br)</span>
            </div>
            <div>
              <span className="lp-d-stat-val">1:1</span>
              <span className="lp-d-stat-lbl">pdi · pop · reuniões</span>
            </div>
          </div>
        </section>

        <aside className="lp-d-card">
          <div className="lp-d-card-tag">entrar</div>
          <h2 className="lp-d-card-title">
            Bem-vindo de volta,<br />
            <em>Lair.</em>
          </h2>
          <p className="lp-d-card-sub">Vamos abrir sua agenda de hoje.</p>
          <LoginFields />
        </aside>
      </main>

      <footer className="lp-d-bottom">
        <span># copyright 2026 — legacy educação</span>
        <div className="lp-d-bottom-right">
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>suporte</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>status</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>privacidade</a>
        </div>
      </footer>
    </div>
  );
};


const LogoGallery = ({ palette = "navy" }) => {
  const items = [
    {
      variant: "peaks",
      num: "01",
      name: "Layered Peaks",
      desc: "Três triângulos ascendentes — milestones e legado se construindo. O símbolo respira progressão.",
    },
    {
      variant: "apex",
      num: "02",
      name: "Apex",
      desc: "Triângulo confiante com um \"A\" emergindo via recorte negativo. Monogramático, forte em pequenos tamanhos.",
    },
    {
      variant: "convene",
      num: "03",
      name: "Convene",
      desc: "Três pontos formando um triângulo — metáfora direta de reunião e alinhamento entre pessoas.",
    },
  ];
  return (
    <div className="lp-gallery" data-palette={palette}>
      {items.map(it => (
        <div className="lp-gallery-cell" key={it.variant}>
          <div className="lp-gallery-light">
            <LegacyWordmark variant={it.variant} color="#0d1b3d" accent="var(--lp-accent)" />
          </div>
          <div className="lp-gallery-dark">
            <LegacyWordmark variant={it.variant} color="#fff" accent="var(--lp-accent-2)" />
          </div>
          <div className="lp-gallery-meta">
            <span className="lp-gallery-num">Conceito {it.num}</span>
            <h3 className="lp-gallery-name">{it.name}</h3>
            <p className="lp-gallery-desc">{it.desc}</p>
          </div>
          <div className="lp-gallery-mini-row">
            <LegacyLogo variant={it.variant} size={20} color="#0d1b3d" accent="var(--lp-accent)" />
            <LegacyLogo variant={it.variant} size={28} color="#0d1b3d" accent="var(--lp-accent)" />
            <LegacyLogo variant={it.variant} size={36} color="#0d1b3d" accent="var(--lp-accent)" />
            <LegacyLogo variant={it.variant} size={48} color="#0d1b3d" accent="var(--lp-accent)" />
            <span style={{ marginLeft: "auto" }}>Escalas</span>
          </div>
        </div>
      ))}
    </div>
  );
};

Object.assign(window, { LoginA, LoginB, LoginC, LoginD, LogoGallery });
