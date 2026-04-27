"use client"

import { Clock3, GitCommitHorizontal } from "lucide-react"
import { Changelog } from "@/components/Changelog"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { Card, CardContent } from "@/components/ui/card"
import { changelogItems } from "@/data/changelog"

const latestRelease = changelogItems[0]

const totalTrackedChanges = changelogItems.reduce((count, item) => {
  return (
    count +
    (item.changes.new?.length || 0) +
    (item.changes.improved?.length || 0) +
    (item.changes.fixed?.length || 0)
  )
}, 0)

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 text-primary" />
                Changelog
              </div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Release notes
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Shipped features, improvements, and fixes in chronological
                order.
              </p>
            </div>

            <div className="grid gap-3 sm:min-w-72">
              <Card className="border-border/60">
                <CardContent className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                      Latest
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      v{latestRelease?.version}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {latestRelease?.date}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <GitCommitHorizontal className="h-4 w-4 text-primary" />
                    <span>{changelogItems.length} releases</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {totalTrackedChanges} changes
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>

          <Changelog isModal />
        </div>
      </main>

      <Footer />
    </div>
  )
}
