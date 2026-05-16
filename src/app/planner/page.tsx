"use client"

import { useChat } from "@ai-sdk/react"
import { ArrowLeft, Bot, CalendarDays, Loader2, Send, User } from "lucide-react"
import Link from "next/link"
import { type FormEvent, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"

const STARTERS = [
  "Reunião de planejamento semanal do comercial",
  "Alinhamento de marketing e produto pra próxima sprint",
  "Comitê de operações: gargalos e prioridades da semana",
  "Reunião de status do financeiro com os principais indicadores",
]

export default function PlannerPage() {
  const { messages, sendMessage, status, error } = useChat()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isBusy = status === "submitted" || status === "streaming"

  const send = async (text: string) => {
    if (!text.trim() || isBusy) return
    setInput("")
    await sendMessage({
      role: "user",
      parts: [{ type: "text", text }],
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Top bar */}
      <div className="border-border bg-card border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div className="bg-border h-4 w-px" />
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <CalendarDays className="text-primary h-4 w-4" />
              </div>
              <div>
                <h1 className="text-foreground font-semibold">
                  Planner de Reuniões
                </h1>
                <p className="text-muted-foreground text-xs">
                  Estratégia e Gestão
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="mt-8 flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <CalendarDays className="text-primary h-8 w-8" />
              </div>
              <h2 className="text-foreground mb-2 text-2xl font-bold">
                Planner de Reuniões Estratégicas
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Me diz o tipo de reunião que você precisa estruturar — eu monto
                a pauta, perguntas-chave e plano de ação.
              </p>

              {/* Starters */}
              <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="border-border bg-card hover:border-foreground/30 rounded-xl border p-3 text-left text-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const text = (m.parts ?? [])
              .filter(
                (p): p is { type: "text"; text: string } =>
                  p.type === "text" && typeof p.text === "string",
              )
              .map((p) => p.text)
              .join("")
            const isUser = m.role === "user"
            return (
              <div
                key={m.id}
                className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`flex max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {isUser ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {text}
                    </div>
                  ) : (
                    <MarkdownBody>{text}</MarkdownBody>
                  )}
                </div>
              </div>
            )
          })}

          {isBusy && (
            <div className="flex gap-4">
              <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted text-foreground flex items-center gap-2 rounded-2xl px-4 py-3">
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                <span className="text-muted-foreground text-sm">
                  Pensando...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
                {error.message ||
                  "Erro ao processar. Verifique se GOOGLE_GENERATIVE_AI_API_KEY está no .env.local."}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-border bg-card border-t p-4">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="border-input bg-background focus-within:ring-primary/20 flex items-center gap-2 rounded-xl border px-3 py-2 focus-within:ring-2"
          >
            <input
              className="placeholder:text-muted-foreground flex-1 bg-transparent px-2 py-1 text-sm outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descreva o contexto da reunião ou os dados da área..."
              disabled={isBusy}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isBusy || !input.trim()}
              className="h-8 w-8 shrink-0 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-muted-foreground mt-2 text-center text-xs">
            O Planner pode cometer erros. Verifique informações importantes.
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="prose-chat text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings — escalonado, sem virar h1 gigante dentro de bubble
          h1: ({ children: c }) => (
            <h3 className="mb-2 mt-2 text-base font-semibold">{c}</h3>
          ),
          h2: ({ children: c }) => (
            <h4 className="mb-2 mt-2 text-sm font-semibold">{c}</h4>
          ),
          h3: ({ children: c }) => (
            <h5 className="mb-1 mt-2 text-sm font-semibold">{c}</h5>
          ),
          p: ({ children: c }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{c}</p>
          ),
          ul: ({ children: c }) => (
            <ul className="mb-2 ml-5 list-disc space-y-1 last:mb-0">{c}</ul>
          ),
          ol: ({ children: c }) => (
            <ol className="mb-2 ml-5 list-decimal space-y-1 last:mb-0">{c}</ol>
          ),
          li: ({ children: c }) => <li className="leading-relaxed">{c}</li>,
          strong: ({ children: c }) => (
            <strong className="font-semibold">{c}</strong>
          ),
          em: ({ children: c }) => <em className="italic">{c}</em>,
          code: ({ children: c }) => (
            <code
              className="rounded px-1 py-0.5 text-[12px]"
              style={{
                background: "rgba(32,32,32,0.08)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {c}
            </code>
          ),
          pre: ({ children: c }) => (
            <pre
              className="my-2 overflow-x-auto rounded-lg p-3 text-[12px]"
              style={{
                background: "rgba(32,32,32,0.08)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {c}
            </pre>
          ),
          a: ({ children: c, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              {c}
            </a>
          ),
          hr: () => <hr className="my-3 border-border" />,
          table: ({ children: c }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">{c}</table>
            </div>
          ),
          th: ({ children: c }) => (
            <th
              className="border-border border-b py-1.5 text-left font-semibold"
              style={{ paddingInline: "8px" }}
            >
              {c}
            </th>
          ),
          td: ({ children: c }) => (
            <td
              className="border-border/40 border-b py-1.5"
              style={{ paddingInline: "8px" }}
            >
              {c}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
