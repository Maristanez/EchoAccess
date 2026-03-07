import { useState, useCallback } from "react"
import type { FormField, ChatMessage, FlowState, FormInfo, Answer } from "@/types"

const API_BASE = "/api"

const PROFILE_KEYWORDS = [
  "name", "first name", "last name", "full name",
  "email", "address", "street", "phone",
  "date of birth", "dob", "city", "postal code", "province",
]

function isProfileField(label: string): boolean {
  const lower = label.toLowerCase()
  return PROFILE_KEYWORDS.some((kw) => lower.includes(kw))
}

let messageIdCounter = 0
function makeId(): string {
  return `msg_${++messageIdCounter}_${Date.now()}`
}

export function useEchoAccess() {
  const [flow, setFlow] = useState<FlowState>("IDLE")
  const [forms, setForms] = useState<FormInfo[]>([])
  const [selectedForm, setSelectedForm] = useState<FormInfo | null>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState("")

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      setMessages((prev) => [...prev, { id: makeId(), role, content }])
    },
    []
  )

  const loadForms = useCallback(async () => {
    const res = await fetch(`${API_BASE}/forms`)
    const data = await res.json()
    setForms(data.forms)
  }, [])

  const initSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/new-session`, { method: "POST" })
      const data = await res.json()
      setThreadId(data.thread_id)
    } catch {
      setThreadId(null)
    }
  }, [])

  const selectForm = useCallback(
    async (form: FormInfo) => {
      setSelectedForm(form)
      setFlow("PARSING")
      setIsLoading(true)
      setMessages([])
      setAnswers([])
      setCurrentFieldIndex(0)
      setSummary("")

      addMessage("assistant", `Reading the ${form.name} form...`)

      try {
        const res = await fetch(`${API_BASE}/parse-form`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form_name: form.id }),
        })
        const data = await res.json()
        setFields(data.fields)
        setFlow("FIELD_LOOP")
        setIsLoading(false)
        return data.fields as FormField[]
      } catch (err) {
        addMessage(
          "assistant",
          "Sorry, I had trouble reading that form. Please try again."
        )
        setFlow("IDLE")
        setIsLoading(false)
        return null
      }
    },
    [addMessage]
  )

  const askNextQuestion = useCallback(
    async (fieldsArr?: FormField[], idx?: number) => {
      const currentFields = fieldsArr ?? fields
      const currentIdx = idx ?? currentFieldIndex

      if (currentIdx >= currentFields.length) {
        setFlow("CONFIRMING")
        setIsLoading(true)

        try {
          const res = await fetch(`${API_BASE}/submit-form`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              thread_id: threadId,
              form_name: selectedForm?.id,
              answers,
            }),
          })
          const data = await res.json()
          setSummary(data.summary)
          addMessage("assistant", data.summary)
          setIsLoading(false)
          return data.summary as string
        } catch {
          const fallback =
            "You've completed all the fields! Would you like me to submit?"
          addMessage("assistant", fallback)
          setIsLoading(false)
          return fallback
        }
      }

      setIsLoading(true)
      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            thread_id: threadId,
            form_name: selectedForm?.id ?? "",
            fields: currentFields,
            current_field_index: currentIdx,
            answered: answers,
          }),
        })
        const data = await res.json()
        const question = data.question as string
        addMessage("assistant", question)
        setIsLoading(false)
        return question
      } catch {
        const field = currentFields[currentIdx]
        const fallback = `What is your ${field.label}?`
        addMessage("assistant", fallback)
        setIsLoading(false)
        return fallback
      }
    },
    [fields, currentFieldIndex, threadId, selectedForm, answers, addMessage]
  )

  const submitAnswer = useCallback(
    async (value: string) => {
      if (currentFieldIndex >= fields.length) return null

      const field = fields[currentFieldIndex]
      addMessage("user", value)

      const newAnswer: Answer = {
        field_id: field.id,
        label: field.label,
        value,
      }
      const newAnswers = [...answers, newAnswer]
      setAnswers(newAnswers)
      const nextIdx = currentFieldIndex + 1
      setCurrentFieldIndex(nextIdx)

      // Save answer to Backboard
      fetch(`${API_BASE}/save-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          field_id: field.id,
          value,
          is_profile_field: isProfileField(field.label),
        }),
      }).catch(() => {})

      return nextIdx
    },
    [currentFieldIndex, fields, answers, threadId, addMessage]
  )

  const confirmSubmit = useCallback(() => {
    setFlow("SUBMITTED")
    addMessage(
      "assistant",
      "Your form has been submitted successfully! Thank you."
    )
  }, [addMessage])

  const reset = useCallback(() => {
    setFlow("IDLE")
    setSelectedForm(null)
    setFields([])
    setCurrentFieldIndex(0)
    setAnswers([])
    setMessages([])
    setSummary("")
    setIsLoading(false)
  }, [])

  const completionPercent =
    fields.length > 0 ? Math.round((currentFieldIndex / fields.length) * 100) : 0

  return {
    flow,
    forms,
    selectedForm,
    fields,
    currentFieldIndex,
    answers,
    messages,
    threadId,
    isLoading,
    summary,
    completionPercent,
    loadForms,
    initSession,
    selectForm,
    askNextQuestion,
    submitAnswer,
    confirmSubmit,
    reset,
    addMessage,
  }
}
