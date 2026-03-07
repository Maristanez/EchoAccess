import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SoundVisualizerProps {
  isListening: boolean
  isSpeaking: boolean
  className?: string
}

const BAR_COUNT = 24

export function SoundVisualizer({ isListening, isSpeaking, className }: SoundVisualizerProps) {
  const mode = isSpeaking ? "speaking" : isListening ? "listening" : "idle"

  return (
    <div
      className={cn("flex items-center justify-center gap-[3px]", className)}
      role="img"
      aria-label={
        isSpeaking ? "EchoAccess is speaking" : isListening ? "EchoAccess is listening" : "Sound visualizer idle"
      }
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const center = (BAR_COUNT - 1) / 2
        const distFromCenter = Math.abs(i - center) / center
        const opacity = 1 - distFromCenter * 0.6

        return (
          <motion.div
            key={`${mode}-${i}`}
            className="w-[3px] rounded-full bg-brand-primary origin-center"
            style={{ opacity, height: 48 }}
            animate={getBarAnimation(mode, i)}
            transition={getBarTransition(mode, i)}
          />
        )
      })}
    </div>
  )
}

function getBarAnimation(mode: string, i: number) {
  if (mode === "listening") {
    return { scaleY: [0.2, 0.6 + Math.random() * 0.4, 0.2] }
  }
  if (mode === "speaking") {
    const phase = i / BAR_COUNT
    return { scaleY: [0.1, 0.5 + phase * 0.4, 0.1] }
  }
  // idle
  const phase = i / BAR_COUNT
  return { scaleY: [0.15, 0.3 + Math.sin(phase * Math.PI) * 0.05, 0.15] }
}

function getBarTransition(mode: string, i: number) {
  if (mode === "listening") {
    return {
      duration: 0.3 + Math.random() * 0.2,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut" as const,
      delay: Math.random() * 0.2,
    }
  }
  if (mode === "speaking") {
    return {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: (i / BAR_COUNT) * 0.8,
    }
  }
  // idle
  return {
    duration: 2.5,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay: (i / BAR_COUNT) * 1.5,
  }
}
