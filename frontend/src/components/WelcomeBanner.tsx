import { TypingAnimation } from "@/components/magicui/typing-animation"

export function WelcomeBanner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-2">
        <span className="text-brand-primary">Echo</span>
        <span className="text-text-primary">Access</span>
      </h1>
      <TypingAnimation
        text="Voice-first form filling for everyone."
        className="text-lg text-muted-foreground mt-2"
        duration={40}
      />
      <p className="text-sm text-muted-foreground mt-6 max-w-md">
        Select a form above to get started. I'll walk you through each field
        using voice — just speak your answers or type them in.
      </p>
    </div>
  )
}
