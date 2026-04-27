import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ErrorTone = "info" | "warning" | "danger" | "neutral"

const toneStyles: Record<
  ErrorTone,
  {
    badge: string
    code: string
    glow: string
  }
> = {
  info: {
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    code: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    glow: "from-sky-500/12 via-transparent to-transparent",
  },
  warning: {
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    code: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    glow: "from-amber-500/12 via-transparent to-transparent",
  },
  danger: {
    badge: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    code: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
    glow: "from-red-500/12 via-transparent to-transparent",
  },
  neutral: {
    badge: "border-border bg-muted/60 text-foreground",
    code: "border-border bg-muted/60 text-foreground",
    glow: "from-foreground/6 via-transparent to-transparent",
  },
}

interface ErrorStateProps {
  code: string
  status: string
  title: string
  description: string
  icon: LucideIcon
  hints: string[]
  actions: React.ReactNode
  tone?: ErrorTone
  note?: string
}

export function ErrorState({
  code,
  status,
  title,
  description,
  icon: Icon,
  hints,
  actions,
  tone = "neutral",
  note,
}: Readonly<ErrorStateProps>) {
  const styles = toneStyles[tone]

  return (
    <section className="border-border/70 bg-background relative overflow-hidden rounded-[1.75rem] border">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))]",
          styles.glow,
        )}
      />

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:p-8">
        <Card className="border-border/60 shadow-none">
          <CardContent className="py-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                    styles.badge,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {status}
                </div>

                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    HTTP status
                  </p>
                  <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
                    {title}
                  </h1>
                </div>
              </div>

              <div
                className={cn(
                  "inline-flex w-fit min-w-24 flex-col rounded-2xl border px-4 py-3 text-right",
                  styles.code,
                )}
              >
                <span className="text-[0.65rem] font-medium tracking-[0.22em] uppercase opacity-80">
                  Code
                </span>
                <span className="text-3xl font-semibold tracking-tight">
                  {code}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7">
              {description}
            </p>

            {note && (
              <p className="text-muted-foreground mt-3 text-sm">{note}</p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {actions}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-semibold tracking-[0.22em] uppercase">
              Next steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hints.map((hint, index) => (
              <div
                key={index}
                className="border-border/70 bg-background rounded-xl border px-4 py-3"
              >
                <p className="text-muted-foreground text-sm leading-6">
                  {hint}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
