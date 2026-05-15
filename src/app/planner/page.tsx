"use client"

import { useChat } from "@ai-sdk/react"
import { ArrowLeft, Bot, CalendarDays, Loader2, Send, User } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

export default function PlannerPage() {
  const { messages, sendMessage, status, error } = useChat()
  const [input, setInput] = React.useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === "in_progress") return

    const userMessage = input
    setInput("")

    await sendMessage({ role: "user", content: userMessage })
  }

  const isLoading = status === "in_progress" || status === "submitted"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">
                  Planner de Reuniões
                </h1>
                <p className="text-xs text-muted-foreground">
                  Estratégia e Gestão
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                Planner de Reuniões Estratégicas
              </h2>
              <p className="max-w-md text-muted-foreground">
                Sou o seu especialista em estruturar reuniões semanais de
                gestão. Me informe o contexto da sua área (Comercial, Marketing,
                Financeiro, Operações ou Liderança) e quais dados precisamos
                analisar para começarmos.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-4 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {m.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`flex max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                  {/* Basic markdown rendering since marked might be complex without a wrapper component, keeping it simple text for now or we could use marked */}
                  {m.content.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== m.content.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Pensando...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error.message ||
                  "Ocorreu um erro ao processar sua mensagem. Verifique se a OPENAI_API_KEY está configurada no .env.local."}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20"
          >
            <input
              className="flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
              value={input}
              onChange={handleInputChange}
              placeholder="Descreva o contexto da reunião ou os dados da área..."
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-8 w-8 shrink-0 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            O Planner de Reuniões pode cometer erros. Considere verificar
            informações importantes.
          </div>
        </div>
      </div>
    </div>
  )
}
