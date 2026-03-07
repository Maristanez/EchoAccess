import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { ChatMessage } from "./ChatMessage"
import { VoiceButton } from "./VoiceButton"
import type { ChatMessage as ChatMessageType } from "@/types"

interface ChatPanelProps {
  messages: ChatMessageType[]
  isListening: boolean
  isSpeaking: boolean
  isLoading: boolean
  voiceSupported: boolean
  onSend: (text: string) => void
  onToggleVoice: () => void
  disabled?: boolean
}

export function ChatPanel({
  messages,
  isListening,
  isSpeaking,
  isLoading,
  voiceSupported,
  onSend,
  onToggleVoice,
  disabled,
}: ChatPanelProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-slot='scroll-area-viewport']")
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    }
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSend(trimmed)
    setInput("")
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-4">
        <div
          className="space-y-4"
          role="log"
          aria-label="Conversation"
          aria-live="polite"
        >
          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              index={i}
            />
          ))}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-xs text-white dark:text-black font-semibold shrink-0">
                EA
              </div>
              <div className="bg-surface-card border border-surface-border rounded-2xl p-3 text-sm text-text-primary/50">
                <span className="inline-flex gap-1 items-center">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                  <span className="ml-1">Thinking</span>
                </span>
              </div>
            </div>
          )}
          {isListening && !isLoading && (
            <div className="flex items-center gap-2 text-red-400 text-xs animate-pulse" role="status" aria-live="assertive">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              Listening — speak now...
            </div>
          )}
          {isSpeaking && !isLoading && (
            <div className="flex items-center gap-2 text-brand-primary/70 text-xs" role="status" aria-live="polite">
              <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
              Speaking...
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-surface-border p-4">
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={
              isListening
                ? "Listening..."
                : isSpeaking
                  ? "Speaking..."
                  : "Type your answer or use the mic..."
            }
            disabled={disabled || isLoading}
            aria-label="Type your answer"
            className="flex-1 bg-surface-card border-surface-border text-text-primary placeholder:text-text-primary/30 rounded-xl"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || disabled || isLoading}
            size="icon"
            aria-label="Send message"
            className="bg-brand-primary text-white dark:text-black rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
          {voiceSupported && (
            <VoiceButton
              isListening={isListening}
              onToggle={onToggleVoice}
              disabled={disabled || isLoading}
            />
          )}
        </div>
        <p className="text-xs text-text-primary/40 mt-2">
          Press Enter to send · Click the mic to speak
        </p>
      </div>
    </div>
  )
}
