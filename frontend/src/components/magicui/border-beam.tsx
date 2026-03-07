import { cn } from "@/lib/utils"

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
}

export function BorderBeam({
  className,
  duration = 12,
  borderWidth = 2,
  colorFrom = "#3b82f6",
  colorTo = "#10b981",
}: BorderBeamProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        border: `${borderWidth}px solid transparent`,
        backgroundImage: `linear-gradient(var(--background), var(--background)), linear-gradient(${colorFrom}, ${colorTo})`,
        backgroundClip: "padding-box, border-box",
        backgroundOrigin: "border-box",
        WebkitMask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: `border-beam-spin ${duration}s linear infinite`,
      }}
    />
  )
}
