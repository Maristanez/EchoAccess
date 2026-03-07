import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes } from "react"

interface PulsatingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pulseColor?: string
  duration?: string
}

export function PulsatingButton({
  className,
  children,
  pulseColor = "#6b7280",
  duration = "1.5s",
  ...props
}: PulsatingButtonProps) {
  return (
    <button
      className={cn("relative", className)}
      style={
        {
          "--pulse-color": pulseColor,
          "--duration": duration,
        } as React.CSSProperties
      }
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <div className="absolute left-1/2 top-1/2 size-full -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full" style={{ backgroundColor: `${pulseColor}40` }} />
    </button>
  )
}
