// Three refined triangle-based logo concepts for Legacy Planning.
// All share the same proportions so they can drop into the same logo slot
// in the login variations.

/* ---------- 1. LAYERED PEAKS ---------------------------------------------
   Three nested upward triangles, ascending in size, slightly offset.
   Reads as milestones / generations / a legacy being built.
-------------------------------------------------------------------------- */
const LogoPeaks = ({ size = 44, color = "currentColor", accent }) => {
  const c = color;
  const a = accent || color;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-label="Legacy Planning">
      {/* back peak — faintest */}
      <path d="M22 8 L40 38 L4 38 Z" stroke={c} strokeWidth="1.6" opacity="0.28" strokeLinejoin="round" />
      {/* middle peak */}
      <path d="M22 13 L36 36 L8 36 Z" stroke={c} strokeWidth="1.8" opacity="0.6" strokeLinejoin="round" />
      {/* front peak — solid accent */}
      <path d="M22 18 L32 34 L12 34 Z" fill={a} stroke={a} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
};

/* ---------- 2. APEX  ------------------------------------------------------
   Single bold triangle with an inverted notch at the apex (negative space).
   Confident, monogrammatic. Reads as an "A" without spelling it out.
-------------------------------------------------------------------------- */
const LogoApex = ({ size = 44, color = "currentColor", accent }) => {
  const c = accent || color;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-label="Legacy Planning">
      <path
        d="M22 6 L40 38 L4 38 Z M22 6 L17 16 L27 16 Z"
        fill={c}
        fillRule="evenodd"
        stroke={c}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* inner crossbar — the "A" hint */}
      <path d="M14 28 L30 28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.92" />
    </svg>
  );
};

/* ---------- 3. CONVENE ---------------------------------------------------
   Three dots at the vertices of a triangle, connected by thin lines.
   Reads as a meeting — three participants in alignment.
-------------------------------------------------------------------------- */
const LogoConvene = ({ size = 44, color = "currentColor", accent }) => {
  const c = color;
  const a = accent || color;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-label="Legacy Planning">
      <path d="M22 9 L37 35 L7 35 Z" stroke={c} strokeWidth="1.4" opacity="0.4" strokeLinejoin="round" />
      <circle cx="22" cy="9" r="3.6" fill={a} />
      <circle cx="37" cy="35" r="3.6" fill={a} />
      <circle cx="7" cy="35" r="3.6" fill={a} />
    </svg>
  );
};

/* ---------- Logo picker ---------- */
const LegacyLogo = ({ variant = "peaks", size = 44, color, accent }) => {
  if (variant === "apex") return <LogoApex size={size} color={color} accent={accent} />;
  if (variant === "convene") return <LogoConvene size={size} color={color} accent={accent} />;
  return <LogoPeaks size={size} color={color} accent={accent} />;
};

/* ---------- Wordmark — locked-up version ---------- */
const LegacyWordmark = ({ variant = "peaks", color = "#fff", accent, scale = 1, stacked = true }) => {
  const fontSize = 22 * scale;
  const logoSize = 44 * scale;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14 * scale,
        color,
      }}
    >
      <LegacyLogo variant={variant} size={logoSize} color={color} accent={accent || color} />
      {stacked ? (
        <div style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 700,
          fontSize,
          lineHeight: 0.98,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}>
          <div>Legacy</div>
          <div>Planning</div>
        </div>
      ) : (
        <div style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 600,
          fontSize: fontSize * 0.95,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}>
          Legacy Planning
        </div>
      )}
    </div>
  );
};

Object.assign(window, { LegacyLogo, LegacyWordmark, LogoPeaks, LogoApex, LogoConvene });
