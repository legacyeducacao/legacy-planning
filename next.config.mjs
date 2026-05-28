/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Strict-Transport-Security: força HTTPS por 2 anos, inclui subdomínios.
  // Só ativa em prod — Next dev usa http://localhost.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Bloqueia o site de ser iframed por terceiros (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Bloqueia sniffing de MIME (defesa contra XSS via upload).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Cross-origin policies: same-origin pra recursos, same-site pra opener.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limita APIs sensíveis (camera, mic, geolocation) — app não usa nenhuma.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
]

const nextConfig = {
  outputFileTracingIncludes: {
    "/api/ata": ["./contexto-legacy/**/*.md"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
