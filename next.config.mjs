/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: "export" to enable API routes and server-side functionality

  // Inclui os arquivos .md de contexto-legacy/ no bundle das functions que
  // os leem em runtime. Sem isso, readFile falha com ENOENT em prod.
  outputFileTracingIncludes: {
    "/api/ata": ["./contexto-legacy/**/*.md"],
    "/api/limpeza": ["./contexto-legacy/**/*.md"],
  },
}

export default nextConfig
