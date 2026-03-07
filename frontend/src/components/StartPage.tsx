import { motion } from "framer-motion"
import { Landmark, Bus, FileText } from "lucide-react"
import { SoundVisualizer } from "@/components/SoundVisualizer"
import { TypingAnimation } from "@/components/magicui/typing-animation"
import { BorderBeam } from "@/components/magicui/border-beam"
import type { FormInfo } from "@/types"
import { useState } from "react"

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const slideUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

const FORM_META: Record<string, { icon: typeof Landmark; description: string }> = {
  "bank-account": { icon: Landmark, description: "Open a new bank account with guided voice assistance" },
  "transit-card": { icon: Bus, description: "Apply for a transit disability discount card" },
  "cra-benefits": { icon: FileText, description: "File for CRA benefits and tax credits" },
}

interface StartPageProps {
  forms: FormInfo[]
  onSelectForm: (form: FormInfo) => void
  isListening: boolean
  isSpeaking: boolean
  voiceSupported: boolean
}

export function StartPage({ forms, onSelectForm, isListening, isSpeaking, voiceSupported }: StartPageProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const statusText = isSpeaking
    ? "Speaking..."
    : isListening
      ? "Listening..."
      : voiceSupported
        ? "Say a form name or tap below"
        : "Select a form below to get started"

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <motion.div
        className="flex flex-col items-center gap-6 max-w-2xl w-full"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Sound Visualizer */}
        <motion.div variants={slideUpVariant}>
          <SoundVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            className="w-[280px] h-16"
          />
        </motion.div>

        {/* Logo */}
        <motion.h2
          className="font-display font-extrabold text-3xl tracking-tight"
          variants={slideUpVariant}
        >
          <span className="text-brand-primary">Echo</span>
          <span className="text-text-primary">Access</span>
        </motion.h2>

        {/* Greeting */}
        <motion.div variants={slideUpVariant}>
          <TypingAnimation
            text="Hi there! Which form would you like to fill out today?"
            className="text-lg text-text-primary/70 text-center"
            duration={30}
          />
        </motion.div>

        {/* Voice status */}
        <motion.p
          className="text-sm text-text-primary/40 flex items-center gap-2"
          variants={slideUpVariant}
        >
          {(isSpeaking || isListening) && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
            </span>
          )}
          {statusText}
        </motion.p>

        {/* Form cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-2"
          variants={staggerContainer}
        >
          {forms.map((form) => {
            const meta = FORM_META[form.id]
            const Icon = meta?.icon ?? FileText
            const desc = meta?.description ?? `Fill out the ${form.name} form`
            const isHovered = hoveredCard === form.id

            return (
              <motion.button
                key={form.id}
                variants={slideUpVariant}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectForm(form)}
                onMouseEnter={() => setHoveredCard(form.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative bg-surface-card border border-surface-border rounded-2xl p-6 text-left cursor-pointer transition-colors hover:border-brand-primary/40 overflow-hidden"
              >
                {isHovered && (
                  <BorderBeam
                    colorFrom="var(--color-brand-primary)"
                    colorTo="var(--color-brand-primary)"
                    duration={4}
                    borderWidth={1.5}
                  />
                )}
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="font-display font-bold text-base text-text-primary mb-1">
                  {form.name}
                </h3>
                <p className="text-text-primary/50 text-sm leading-relaxed">
                  {desc}
                </p>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Hint */}
        <motion.p
          className="text-xs text-text-primary/30 mt-2"
          variants={slideUpVariant}
        >
          Or use the dropdown above
        </motion.p>
      </motion.div>
    </div>
  )
}
