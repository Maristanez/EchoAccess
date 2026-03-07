import { PulsatingButton } from "@/components/magicui/pulsating-button"
import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceButtonProps {
  isListening: boolean
  onToggle: () => void
  disabled?: boolean
}

export function VoiceButton({ isListening, onToggle, disabled }: VoiceButtonProps) {
  return (
    <PulsatingButton
      pulseColor={isListening ? "#ef4444" : "#6b7280"}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "rounded-full p-4 transition-colors cursor-pointer",
        isListening ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label={isListening ? "Stop listening" : "Start listening"}
    >
      {isListening ? (
        <Mic className="h-6 w-6" />
      ) : (
        <MicOff className="h-6 w-6" />
      )}
    </PulsatingButton>
  )
}
