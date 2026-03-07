import { useState, useRef, useCallback } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any

interface UseVoiceReturn {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => Promise<void>
  cancelSpeech: () => void
  clearTranscript: () => void
  supported: boolean
}

function getSpeechRecognition(): SpeechRecognitionType | null {
  if (typeof window === "undefined") return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)

  const SpeechRecognitionAPI = getSpeechRecognition()

  const supported = !!SpeechRecognitionAPI

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript as string
      setTranscript(result)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [SpeechRecognitionAPI])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const speakBrowserFallback = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const speak = useCallback(async (text: string): Promise<void> => {
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    window.speechSynthesis.cancel()

    setIsSpeaking(true)
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error("TTS API failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio

      return new Promise<void>((resolve) => {
        audio.onended = () => {
          setIsSpeaking(false)
          currentAudioRef.current = null
          URL.revokeObjectURL(url)
          resolve()
        }
        audio.onerror = () => {
          setIsSpeaking(false)
          currentAudioRef.current = null
          URL.revokeObjectURL(url)
          resolve()
        }
        audio.play().catch(() => {
          // Autoplay blocked or error — fall back to browser TTS
          URL.revokeObjectURL(url)
          setIsSpeaking(false)
          speakBrowserFallback(text).then(resolve)
        })
      })
    } catch {
      // ElevenLabs unavailable — fall back to browser TTS
      return speakBrowserFallback(text)
    }
  }, [speakBrowserFallback])

  const cancelSpeech = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    clearTranscript,
    supported,
  }
}
