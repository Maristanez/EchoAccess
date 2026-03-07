import { useRef } from "react"
import { motion, useInView } from "framer-motion"

interface BlurFadeProps {
  children: React.ReactNode
  className?: string
  delay?: number
  inView?: boolean
  blur?: string
}

export function BlurFade({
  children,
  className,
  delay = 0,
  inView: inViewProp = false,
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inViewResult = useInView(ref, { once: true })
  const isInView = inViewProp ? inViewResult : true

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: `blur(${blur})`, y: 8 }}
      animate={isInView ? { opacity: 1, filter: "blur(0px)", y: 0 } : undefined}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
