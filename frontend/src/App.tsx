import { useState, useEffect, useCallback, useRef } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { Auth } from "@/components/Auth"
import { useEchoAccess } from "@/hooks/useEchoAccess"
import { useVoice } from "@/hooks/useVoice"
import { ChatPanel } from "@/components/ChatPanel"
import { FormPreview } from "@/components/FormPreview"
import { FormSelector } from "@/components/FormSelector"
import { StartPage } from "@/components/StartPage"
import { ProgressBar } from "@/components/ProgressBar"
import { Confetti } from "@/components/magicui/confetti"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RotateCcw, CheckCircle2, Pencil, LogOut } from "lucide-react"
import type { FormInfo } from "@/types"
import { LandingPage } from "@/components/LandingPage"

function matchFormByVoice(transcript: string, forms: FormInfo[]): FormInfo | null {
  const lower = transcript.toLowerCase()
  // Try exact-ish name match first
  const match = forms.find((f) => lower.includes(f.name.toLowerCase()))
  if (match) return match
  // Keyword match
  const keywords: Record<string, string[]> = {
    "bank-account": ["bank", "td", "account"],
    "transit-card": ["transit", "ttc", "disability", "discount"],
    "cra-benefits": ["cra", "benefits", "tax"],
  }
  for (const form of forms) {
    const kws = keywords[form.id] ?? form.name.toLowerCase().split(/\s+/)
    if (kws.some((kw) => lower.includes(kw))) return form
  }
  return null
}

function AppContent() {
  const echo = useEchoAccess()
  const voice = useVoice()
  const hasInitialized = useRef(false)
  const voiceFormSelectionRef = useRef(false)
  const hasGreetedRef = useRef(false)

  // Load forms and init session on mount
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    echo.loadForms()
    echo.initSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Voice greeting when forms first load
  useEffect(() => {
    if (echo.forms.length > 0 && !hasGreetedRef.current && voice.supported) {
      hasGreetedRef.current = true
      const names = echo.forms.map((f) => f.name).join(", ")
      voice
        .speak(`Welcome to EchoAccess! Which form would you like to fill out? Your options are: ${names}.`)
        .then(() => {
          voiceFormSelectionRef.current = true
          voice.startListening()
        })
    }
  }, [echo.forms]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSelect = useCallback(
    async (form: FormInfo) => {
      const fields = await echo.selectForm(form)
      if (fields) {
        const question = await echo.askNextQuestion(fields, 0)
        if (question) {
          voice.speak(question).then(() => {
            if (voice.supported) voice.startListening()
          })
        }
      }
    },
    [echo, voice]
  )

  const handleUserInput = useCallback(
    async (text: string) => {
      if (echo.flow === "CONFIRMING") {
        const lower = text.toLowerCase()
        if (
          lower.includes("yes") ||
          lower.includes("submit") ||
          lower.includes("confirm")
        ) {
          echo.confirmSubmit()
          voice.speak(
            "Your form has been submitted successfully! Thank you."
          )
        } else {
          voice.speak(
            "No problem. You can change any answer by telling me which field to update."
          ).then(() => {
            if (voice.supported) voice.startListening()
          })
        }
        return
      }

      if (echo.flow !== "FIELD_LOOP") return

      const nextIdx = await echo.submitAnswer(text)
      if (nextIdx === null) return

      const question = await echo.askNextQuestion(undefined, nextIdx)
      if (question) {
        voice.speak(question).then(() => {
          if (voice.supported) voice.startListening()
        })
      }
    },
    [echo, voice]
  )

  // When voice transcript changes, handle it
  useEffect(() => {
    if (!voice.transcript) return
    const t = voice.transcript
    voice.clearTranscript()

    // Voice form selection during IDLE
    if (voiceFormSelectionRef.current && echo.flow === "IDLE") {
      voiceFormSelectionRef.current = false
      const matched = matchFormByVoice(t, echo.forms)
      if (matched) {
        handleFormSelect(matched)
      } else {
        voice
          .speak("I didn't catch that. Please say a form name or select from the dropdown.")
          .then(() => {
            voiceFormSelectionRef.current = true
            voice.startListening()
          })
      }
      return
    }

    if (echo.flow === "FIELD_LOOP" || echo.flow === "CONFIRMING") {
      handleUserInput(t)
    }
  }, [voice.transcript]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleVoice = useCallback(() => {
    if (voice.isListening) {
      voice.stopListening()
    } else {
      voice.cancelSpeech()
      voice.startListening()
    }
  }, [voice])

  const isFormActive =
    echo.flow === "FIELD_LOOP" ||
    echo.flow === "CONFIRMING" ||
    echo.flow === "PARSING"

  const showFormPreview = isFormActive || echo.flow === "SUBMITTED"

  return (
    <div className="flex flex-col h-screen bg-surface-page text-text-primary">
      {/* Top Bar */}
      <header className="border-b border-surface-border bg-surface-nav backdrop-blur-md px-4 py-3 flex items-center gap-4 shrink-0">
        <h1 className="font-display text-xl font-bold tracking-tight">
          <span className="text-brand-primary">Echo</span>
          <span className="text-text-primary">Access</span>
        </h1>
        <Separator orientation="vertical" className="h-6" />
        <FormSelector
          forms={echo.forms}
          selectedForm={echo.selectedForm}
          onSelect={handleFormSelect}
          disabled={echo.isLoading}
        />
        {showFormPreview && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <ProgressBar
              current={Math.min(echo.currentFieldIndex, echo.fields.length)}
              total={echo.fields.length}
              percent={echo.completionPercent}
            />
          </>
        )}
        <div className="flex-1" />
        {echo.flow !== "IDLE" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={echo.reset}
            aria-label="Start over"
            className="text-text-primary/60 hover:text-text-primary hover:bg-surface-card rounded-full"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Start Over
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-text-primary/60 hover:text-text-primary hover:bg-surface-card rounded-full">
          <LogOut className="h-4 w-4 mr-1" />
          Sign Out
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {echo.flow === "IDLE" ? (
          <StartPage
            forms={echo.forms}
            onSelectForm={handleFormSelect}
            isListening={voice.isListening}
            isSpeaking={voice.isSpeaking}
            voiceSupported={voice.supported}
          />
        ) : (
          <>
            {/* Chat Panel */}
            <div className="flex-1 lg:w-3/5 border-r flex flex-col">
              <ChatPanel
                messages={echo.messages}
                isListening={voice.isListening}
                isSpeaking={voice.isSpeaking}
                isLoading={echo.isLoading}
                voiceSupported={voice.supported}
                onSend={handleUserInput}
                onToggleVoice={toggleVoice}
                disabled={
                  echo.flow === "SUBMITTED" || echo.flow === "PARSING"
                }
              />
            </div>

            {/* Form Preview */}
            {showFormPreview && (
              <div className="hidden lg:block lg:w-2/5 p-4 overflow-y-auto">
                <FormPreview
                  formName={echo.selectedForm?.name ?? ""}
                  fields={echo.fields}
                  currentFieldIndex={echo.currentFieldIndex}
                  answers={echo.answers}
                  completionPercent={echo.completionPercent}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Success state */}
      {echo.flow === "SUBMITTED" && (
        <Alert className="m-4 border-brand-primary/30 bg-brand-primary/10">
          <CheckCircle2 className="h-4 w-4 text-brand-primary" />
          <AlertDescription className="text-brand-primary">
            Form submitted successfully! You can select another form or start
            over.
          </AlertDescription>
        </Alert>
      )}

      {/* Confetti */}
      <Confetti active={echo.flow === "SUBMITTED"} />

      {/* Confirmation Dialog */}
      <Dialog
        open={echo.flow === "CONFIRMING" && !!echo.summary}
        onOpenChange={() => { }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Your Answers</DialogTitle>
            <DialogDescription>
              Please review your answers below. Click the pencil icon to edit any field.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-2 pr-2">
              {echo.answers.map((answer, i) => (
                <div
                  key={answer.field_id}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary/50">
                      {answer.label}
                    </p>
                    <p className="text-sm font-medium truncate">
                      {answer.value}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => {
                      echo.goToField(i)
                      const field = echo.fields[i]
                      if (field) {
                        echo.askNextQuestion(undefined, i).then((q) => {
                          if (q) voice.speak(q)
                        })
                      }
                    }}
                    aria-label={`Edit ${answer.label}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          {echo.summary && (
            <p className="text-sm text-text-primary/50 mt-2 border-t border-surface-border pt-2">
              {echo.summary}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={echo.reset}>
              Start Over
            </Button>
            <Button
              className="bg-brand-primary text-white dark:text-black"
              onClick={() => {
                echo.confirmSubmit()
                voice.speak(
                  "Your form has been submitted successfully! Thank you."
                )
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-surface-border px-4 py-2 text-xs text-text-primary/30 text-center shrink-0">
        Tab to navigate · Enter to confirm · Esc to go back · Powered by Gemini
        + Backboard.io
      </footer>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [showLanding, setShowLanding] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Step 1: Always show landing page first
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />
  }

  // Step 2: After landing, require login
  if (!session) {
    return <Auth />
  }

  // Step 3: Logged in → main app
  return <AppContent />
}
