import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TypingAnimationProps {
  text: string
  className?: string
  duration?: number
}

export function TypingAnimation({ text, className, duration = 50 }: TypingAnimationProps) {
  const [displayed, setDisplayed] = useState("")
  const [index, setIndex] = useState(0)

  const [prevText, setPrevText] = useState(text)

  if (text !== prevText) {
    setPrevText(text)
    setDisplayed("")
    setIndex(0)
  }

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayed((prev) => prev + text[index])
        setIndex((prev) => prev + 1)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [index, text, duration])

  return (
    <span className={cn(className)} aria-label={text}>
      {displayed}
      {index < text.length && <span className="animate-pulse">|</span>}
    </span>
  )
}
