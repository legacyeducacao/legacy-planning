export const LoadingFallback = () => (
  <div className="bg-background flex min-h-screen items-center justify-center">
    <div className="flex space-x-2">
      <div className="animate-pulse-dot-1 bg-foreground h-3 w-3 rounded-full"></div>
      <div className="animate-pulse-dot-2 bg-foreground h-3 w-3 rounded-full"></div>
      <div className="animate-pulse-dot-3 bg-foreground h-3 w-3 rounded-full"></div>
    </div>
  </div>
)
