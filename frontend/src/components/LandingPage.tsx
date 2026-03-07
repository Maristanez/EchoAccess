import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Mic, Brain, Layers, Lock } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
  }),
}

const staggerContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// ─── VoiceOrb ────────────────────────────────────────────────────────────────

function VoiceOrb() {
  const breathRings = [0, 1, 2]
  const staticRings = [
    { size: 340, duration: 44, dir: 1 },
    { size: 300, duration: 36, dir: -1 },
    { size: 260, duration: 28, dir: 1 },
    { size: 220, duration: 20, dir: -1 },
  ]

  return (
    <div
      className="relative w-[400px] h-[400px] flex items-center justify-center"
      role="img"
      aria-label="Animated voice orb representing EchoAccess"
    >
      {/* Breath rings */}
      {breathRings.map((i) => (
        <motion.div
          key={`breath-${i}`}
          aria-hidden="true"
          className="absolute rounded-full border border-black/5 dark:border-brand-primary/30"
          style={{ width: 180 + i * 40, height: 180 + i * 40 }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Static concentric border rings */}
      {staticRings.map(({ size, duration, dir }, i) => (
        <motion.div
          key={`ring-${i}`}
          aria-hidden="true"
          className="absolute rounded-full border border-surface-border"
          style={{ width: size, height: size }}
          animate={{ rotate: dir * 360 }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* Glowing core */}
      <div
        aria-hidden="true"
        className="absolute w-32 h-32 rounded-full hidden dark:block"
        style={{
          background: "radial-gradient(circle, #e8ff5a55 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Pulsing lime disc */}
      <motion.div
        aria-hidden="true"
        className="absolute w-24 h-24 rounded-full bg-brand-primary"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Mic icon */}
      <Mic
        aria-hidden="true"
        className="relative z-10 w-10 h-10 text-black"
        strokeWidth={2.5}
      />
    </div>
  )
}

// ─── NavSection ───────────────────────────────────────────────────────────────

function NavSection({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants}
      custom={0}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-surface-nav backdrop-blur-md border-b border-surface-border"
      aria-label="Primary navigation"
    >
      <span className="font-display font-bold text-xl tracking-tight">
        <span className="text-brand-primary">Echo</span>
        <span className="text-text-primary">Access</span>
      </span>

      <ul className="hidden md:flex items-center gap-6 text-sm text-text-primary/60" role="list">
        <li role="listitem">
          <a
            href="#how-it-works"
            className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
          >
            How it Works
          </a>
        </li>
        <li role="listitem">
          <a
            href="#use-cases"
            className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
          >
            Use Cases
          </a>
        </li>
        <li role="listitem">
          <a
            href="#features"
            className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
          >
            Features
          </a>
        </li>
      </ul>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={onEnter}
          className="px-4 py-2 rounded-full bg-brand-primary text-white dark:text-black text-sm font-semibold hover:bg-brand-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset-page"
        >
          Try Demo
        </button>
      </div>
    </motion.nav>
  )
}

// ─── HeroSection ─────────────────────────────────────────────────────────────

function HeroSection({ onEnter }: { onEnter: () => void }) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center bg-surface-page pt-20 overflow-hidden"
    >
      {/* Lime radial tint */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 50%, #e8ff5a0d 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            custom={0.1}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-primary/30 text-brand-primary text-xs font-semibold tracking-wider uppercase">
              <span aria-hidden="true">●</span> Voice-First Accessibility
            </span>
          </motion.div>

          <motion.h1
            id="hero-heading"
            className="font-display font-extrabold text-5xl lg:text-6xl xl:text-7xl leading-[1.05] text-text-primary"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            custom={0.2}
          >
            Forms, spoken.<br />
            <span className="text-brand-primary">Barriers,</span> broken.
          </motion.h1>

          <motion.p
            className="text-lg text-text-primary/60 max-w-md leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            custom={0.3}
          >
            EchoAccess transforms complex government and institutional forms into
            guided voice conversations — so anyone can complete them independently.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            custom={0.4}
          >
            <button
              onClick={onEnter}
              className="px-7 py-3.5 rounded-full bg-brand-primary text-white dark:text-black font-bold text-base hover:bg-brand-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset-page"
            >
              Launch Demo
            </button>
            <a
              href="#how-it-works"
              className="text-text-primary/60 hover:text-text-primary text-sm underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Right — Orb */}
        <motion.div
          className="hidden lg:flex justify-center items-center"
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          custom={0.3}
        >
          <VoiceOrb />
        </motion.div>
      </div>
    </section>
  )
}

// ─── MarqueeBar ───────────────────────────────────────────────────────────────

const MARQUEE_LABELS = [
  "Banking Forms",
  "Government Applications",
  "Medical Intake",
  "Benefits Enrollment",
  "Employment Forms",
  "Transit Services",
  "Insurance Claims",
  "Tax Filing",
  "Court Documents",
  "University Applications",
]

function MarqueeBar() {
  const items = [...MARQUEE_LABELS, ...MARQUEE_LABELS]

  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden bg-brand-primary py-3 border-y border-brand-primary/50"
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {items.map((label, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-4 px-6 font-display font-bold text-sm text-white dark:text-black uppercase tracking-widest"
          >
            {label}
            <span className="opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Form / Chat Mockups ──────────────────────────────────────────────────────

function FormMockup() {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 top-8 w-64 bg-surface-card border border-surface-border rounded-xl p-4 shadow-2xl"
      style={{ transform: "rotate(-3deg)" }}
    >
      <div className="h-3 w-24 bg-text-primary/20 rounded mb-4" />
      {[80, 60, 72, 50].map((w, i) => (
        <div key={i} className="mb-3">
          <div className="h-2 rounded bg-text-primary/10 mb-1.5" style={{ width: `${w}%` }} />
          <div className="h-7 rounded bg-text-primary/[0.06] border border-surface-border" />
        </div>
      ))}
    </div>
  )
}

function ChatMockup() {
  const msgs = [
    { from: "ai", text: "What's your date of birth?" },
    { from: "user", text: "March 15, 1990" },
    { from: "ai", text: "Got it. What's your current address?" },
  ]

  return (
    <div
      aria-hidden="true"
      className="absolute right-0 bottom-0 w-72 bg-surface-card border border-surface-border rounded-xl p-4 shadow-2xl"
      style={{ transform: "rotate(2deg)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
          <Mic aria-hidden="true" className="w-3 h-3 text-white dark:text-black" />
        </div>
        <span className="text-xs font-semibold text-text-primary">EchoAccess</span>
      </div>
      <div className="flex flex-col gap-2">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`text-xs px-3 py-2 rounded-xl max-w-[80%] ${
                m.from === "ai"
                  ? "bg-text-primary/[0.08] text-text-primary/80"
                  : "bg-brand-primary text-white dark:text-black font-medium"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── HowItWorksSection ────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "Pick a form",
    desc: "Choose from dozens of pre-loaded government, medical, and institutional forms.",
  },
  {
    num: "02",
    title: "Answer by voice",
    desc: "EchoAccess asks each question naturally. Answer out loud or type — your choice.",
  },
  {
    num: "03",
    title: "Review & submit",
    desc: "Hear a summary of your answers, confirm, and submit — all without touching a form.",
  },
]

function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px 0px" })

  return (
    <section
      id="how-it-works"
      ref={ref}
      aria-labelledby="how-heading"
      className="bg-surface-page py-28 px-6 lg:px-12"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: steps */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainerVariants}
        >
          <motion.h2
            id="how-heading"
            className="font-display font-extrabold text-4xl lg:text-5xl text-text-primary mb-12"
            variants={cardItemVariants}
          >
            How it works
          </motion.h2>
          <ol className="flex flex-col gap-10" role="list">
            {STEPS.map((s) => (
              <motion.li key={s.num} role="listitem" variants={cardItemVariants} className="flex gap-6">
                <span className="font-display font-bold text-4xl text-brand-primary/30 leading-none w-12 shrink-0">
                  {s.num}
                </span>
                <div>
                  <h3 className="font-display font-bold text-xl text-text-primary mb-1">{s.title}</h3>
                  <p className="text-text-primary/50 leading-relaxed">{s.desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.div>

        {/* Right: mockups */}
        <motion.div
          className="relative h-[400px] hidden lg:block"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUpVariants}
          custom={0.2}
        >
          <FormMockup />
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  )
}

// ─── UseCasesSection ──────────────────────────────────────────────────────────

const USE_CASES = [
  { title: "Banking", desc: "Account applications, loan forms, and wire transfers." },
  { title: "Government", desc: "Benefits applications, permits, and ID renewals." },
  { title: "Medical", desc: "Patient intake, insurance pre-auth, and referrals." },
  { title: "Employment", desc: "Job applications, tax forms, and onboarding docs." },
  { title: "Transit", desc: "Paratransit enrollment and reduced-fare applications." },
  { title: "Benefits", desc: "SNAP, Medicaid, housing assistance, and more." },
]

function UseCasesSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px 0px" })

  return (
    <section
      id="use-cases"
      ref={ref}
      aria-labelledby="usecases-heading"
      className="bg-surface-section py-28 px-6 lg:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainerVariants}
        >
          <motion.h2
            id="usecases-heading"
            className="font-display font-extrabold text-4xl lg:text-5xl text-text-primary mb-4"
            variants={cardItemVariants}
          >
            Built for every door<br />
            <span className="text-brand-primary">that should be open.</span>
          </motion.h2>
          <motion.p className="text-text-primary/50 mb-12 max-w-lg" variants={cardItemVariants}>
            From federal benefits to local transit — EchoAccess handles the forms
            that matter most.
          </motion.p>

          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
          >
            {USE_CASES.map((uc) => (
              <motion.li
                key={uc.title}
                role="listitem"
                variants={cardItemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-surface-card border border-surface-border rounded-2xl p-6 cursor-default"
              >
                <h3 className="font-display font-bold text-lg text-text-primary mb-2">{uc.title}</h3>
                <p className="text-text-primary/50 text-sm leading-relaxed">{uc.desc}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FeaturesSection ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    title: "Backboard AI",
    desc: "Powered by Gemini — intelligently parses form fields and generates natural conversational questions tailored to each context.",
  },
  {
    icon: Mic,
    title: "Voice-First",
    desc: "Full speech-to-text and text-to-speech support. Complete any form entirely hands-free, with zero screen interaction required.",
  },
  {
    icon: Layers,
    title: "Remembers You",
    desc: "Session memory retains your answers as you go, so you can correct mistakes or backtrack without starting over.",
  },
  {
    icon: Lock,
    title: "Privacy by Design",
    desc: "No data stored server-side. All form answers live in your browser session and are discarded when you're done.",
  },
]

function FeaturesSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px 0px" })

  return (
    <section
      id="features"
      ref={ref}
      aria-labelledby="features-heading"
      className="bg-surface-page py-28 px-6 lg:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainerVariants}
        >
          <motion.h2
            id="features-heading"
            className="font-display font-extrabold text-4xl lg:text-5xl text-text-primary mb-4"
            variants={cardItemVariants}
          >
            Everything you need.<br />
            <span className="text-brand-primary">Nothing you don't.</span>
          </motion.h2>
          <motion.p className="text-text-primary/50 mb-12 max-w-lg" variants={cardItemVariants}>
            Carefully designed features that work together to remove every barrier
            between a user and a completed form.
          </motion.p>

          <ul
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            role="list"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <motion.li
                  key={f.title}
                  role="listitem"
                  variants={cardItemVariants}
                  className="bg-surface-card border border-surface-border rounded-2xl p-8"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-5">
                    <Icon aria-hidden="true" className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-text-primary mb-2">{f.title}</h3>
                  <p className="text-text-primary/50 leading-relaxed">{f.desc}</p>
                </motion.li>
              )
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}

// ─── CtaSection ───────────────────────────────────────────────────────────────

function CtaSection({ onEnter }: { onEnter: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px 0px" })

  return (
    <section
      ref={ref}
      aria-labelledby="cta-heading"
      className="bg-surface-section py-28 px-6 lg:px-12"
    >
      <motion.div
        className="max-w-3xl mx-auto text-center bg-surface-card border border-surface-border rounded-3xl p-12 lg:p-16"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={fadeUpVariants}
        custom={0}
      >
        <h2
          id="cta-heading"
          className="font-display font-extrabold text-4xl lg:text-5xl text-text-primary mb-4"
        >
          Ready to break down<br />
          <span className="text-brand-primary">the barrier?</span>
        </h2>
        <p className="text-text-primary/50 mb-10 max-w-md mx-auto leading-relaxed">
          Try EchoAccess right now — no sign-up, no download, no cost.
          Just your voice and the form.
        </p>
        <button
          onClick={onEnter}
          className="px-8 py-4 rounded-full bg-text-primary text-surface-page font-bold text-base hover:bg-text-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset-card"
        >
          Launch EchoAccess
        </button>
      </motion.div>
    </section>
  )
}

// ─── FooterSection ────────────────────────────────────────────────────────────

function FooterSection() {
  return (
    <footer className="bg-surface-page border-t border-surface-border px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="font-display font-bold text-base">
        <span className="text-brand-primary">Echo</span>
        <span className="text-text-primary">Access</span>
      </span>
      <p className="text-text-primary/30 text-sm">
        © {new Date().getFullYear()} EchoAccess. Built for accessibility.
      </p>
      <nav aria-label="Footer navigation">
        <ul className="flex items-center gap-5 text-sm text-text-primary/40" role="list">
          <li role="listitem">
            <a
              href="#how-it-works"
              className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
            >
              How it Works
            </a>
          </li>
          <li role="listitem">
            <a
              href="#use-cases"
              className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
            >
              Use Cases
            </a>
          </li>
          <li role="listitem">
            <a
              href="#features"
              className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
            >
              Features
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  )
}

// ─── LandingPage (root export) ────────────────────────────────────────────────

interface LandingPageProps {
  onEnter: () => void
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="bg-surface-page text-text-primary">
      <NavSection onEnter={onEnter} />
      <HeroSection onEnter={onEnter} />
      <MarqueeBar />
      <HowItWorksSection />
      <UseCasesSection />
      <FeaturesSection />
      <CtaSection onEnter={onEnter} />
      <FooterSection />
    </div>
  )
}
