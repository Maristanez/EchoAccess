import { useState, useCallback, useRef } from "react"
import type { FormField, ChatMessage, FlowState, FormInfo, Answer } from "@/types"
import { supabase } from "@/lib/supabase"

const API_BASE = "/api"

const PROFILE_KEYWORDS = [
  "name", "first name", "last name", "full name",
  "email", "address", "street", "phone",
  "date of birth", "dob", "city", "postal code", "province",
]

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers = new Headers(options.headers)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

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
  const [selectedForm, _setSelectedForm] = useState<FormInfo | null>(null)
  const selectedFormRef = useRef<FormInfo | null>(null)
  const setSelectedForm = (form: FormInfo | null) => {
    selectedFormRef.current = form
    _setSelectedForm(form)
  }

  const [fields, setFields] = useState<FormField[]>([])
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)

  const [answers, _setAnswers] = useState<Answer[]>([])
  const answersRef = useRef<Answer[]>([])
  const setAnswers = (val: Answer[] | ((prev: Answer[]) => Answer[])) => {
    if (typeof val === "function") {
      _setAnswers((prev) => {
        const next = val(prev)
        answersRef.current = next
        return next
      })
    } else {
      answersRef.current = val
      _setAnswers(val)
    }
  }
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState("")
  const lastQuestionRef = useRef<string>("")
  const parsedFormsCache = useRef<Record<string, FormField[]>>({})
  const firstQuestionCache = useRef<Record<string, string>>({})

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      setMessages((prev) => [...prev, { id: makeId(), role, content }])
    },
    []
  )

  const loadForms = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/forms`)
      if (!res.ok) {
        console.error("[loadForms] API error:", res.status, res.statusText)
        return
      }
      const data = await res.json()
      const list = Array.isArray(data.forms) ? data.forms : []
      console.log("[loadForms] forms received:", list)
      setForms(list)

      // Pre-parse all forms and pre-generate first questions in background
      for (const form of list) {
        fetchWithAuth(`${API_BASE}/parse-form`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form_name: form.id }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.fields) {
              parsedFormsCache.current[form.id] = d.fields
              console.log(`[preparse] cached ${form.id}: ${d.fields.length} fields`)

              // Pre-generate first question
              fetchWithAuth(`${API_BASE}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  thread_id: null,
                  form_name: form.id,
                  fields: d.fields,
                  current_field_index: 0,
                  answered: [],
                }),
              })
                .then((r) => r.json())
                .then((q) => {
                  if (q.question) {
                    firstQuestionCache.current[form.id] = q.question
                    console.log(`[pregen] cached first question for ${form.id}`)
                  }
                })
                .catch(() => { })
            }
          })
          .catch(() => { })
      }
    } catch (err) {
      console.error("[loadForms] fetch failed:", err)
    }
  }, [])

  const initSession = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/new-session`, { method: "POST" })
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

      // Use cached fields if available
      const cached = parsedFormsCache.current[form.id]
      if (cached) {
        addMessage("assistant", `Let's fill out the ${form.name}. I'll ask you one at a time — just speak or type your answers.`)
        setFields(cached)
        setFlow("FIELD_LOOP")
        setIsLoading(false)
        return cached
      }

      addMessage("assistant", `Great, let's fill out the ${form.name}. Give me a moment to read the form...`)

      try {
        const res = await fetchWithAuth(`${API_BASE}/parse-form`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form_name: form.id }),
        })
        const data = await res.json()
        if (!res.ok || !Array.isArray(data.fields)) {
          throw new Error(data.detail || "Failed to parse form")
        }
        const parsedFields = data.fields as FormField[]
        parsedFormsCache.current[form.id] = parsedFields
        setFields(parsedFields)
        setFlow("FIELD_LOOP")
        setIsLoading(false)
        addMessage(
          "assistant",
          `I found ${parsedFields.length} fields. I'll ask you one at a time — just speak or type your answers.`
        )
        return parsedFields
      } catch {
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
          const res = await fetchWithAuth(`${API_BASE}/submit-form`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              thread_id: threadId,
              form_name: selectedFormRef.current?.id,
              answers: answersRef.current,
            }),
          })
          const data = await res.json()
          if (!res.ok || typeof data.summary !== "string") {
            throw new Error(data.detail || "Failed to generate summary")
          }
          setSummary(data.summary)
          addMessage("assistant", data.summary)
          setIsLoading(false)
          return data.summary
        } catch {
          const fallback =
            "You've completed all the fields! Would you like me to submit?"
          addMessage("assistant", fallback)
          setIsLoading(false)
          return fallback
        }
      }

      // Use cached first question if available
      const formId = selectedFormRef.current?.id ?? ""
      if (currentIdx === 0 && answersRef.current.length === 0 && firstQuestionCache.current[formId]) {
        const question = firstQuestionCache.current[formId]
        delete firstQuestionCache.current[formId]
        lastQuestionRef.current = question
        addMessage("assistant", question)
        return question
      }

      setIsLoading(true)
      try {
        const res = await fetchWithAuth(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            thread_id: threadId,
            form_name: formId,
            fields: currentFields,
            current_field_index: currentIdx,
            answered: answersRef.current,
          }),
        })
        const data = await res.json()
        if (!res.ok || typeof data.question !== "string") {
          throw new Error(data.detail || "Failed to generate question")
        }
        const question = data.question
        lastQuestionRef.current = question
        addMessage("assistant", question)
        setIsLoading(false)
        return question
      } catch {
        const field = currentFields[currentIdx]
        const fallback = `What is your ${field.label}?`
        lastQuestionRef.current = fallback
        addMessage("assistant", fallback)
        setIsLoading(false)
        return fallback
      }
    },
    [fields, currentFieldIndex, threadId, addMessage]
  )

  const submitAnswer = useCallback(
    async (value: string) => {
      if (currentFieldIndex >= fields.length) return null

      const field = fields[currentFieldIndex]
      addMessage("user", value)

      // Extract the actual value using LLM (handles "yes" confirmations, corrections, etc.)
      let extractedValue = value
      try {
        const res = await fetchWithAuth(`${API_BASE}/extract-answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field,
            question: lastQuestionRef.current,
            user_response: value,
          }),
        })
        const data = await res.json()
        if (data.needs_reask) {
          // User said "no" without providing an alternative — caller handles re-ask
          lastQuestionRef.current = `What is your ${field.label}?`
          return null
        }
        extractedValue = data.value
      } catch {
        // Fallback: use raw value if extraction fails
        extractedValue = value
      }

      const newAnswer: Answer = {
        field_id: field.id,
        label: field.label,
        value: extractedValue,
      }
      const newAnswers = [...answersRef.current, newAnswer]
      setAnswers(newAnswers)
      const nextIdx = currentFieldIndex + 1
      setCurrentFieldIndex(nextIdx)

      // Save answer to Backboard
      fetchWithAuth(`${API_BASE}/save-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          field_id: field.id,
          value: extractedValue,
          is_profile_field: isProfileField(field.label),
        }),
      }).catch(() => { })

      return nextIdx
    },
    [currentFieldIndex, fields, threadId, addMessage]
  )

  const confirmSubmit = useCallback(() => {
    setFlow("SUBMITTED")
    addMessage(
      "assistant",
      "Your form has been submitted successfully! Thank you."
    )
  }, [addMessage])

  const goToField = useCallback(
    (fieldIndex: number) => {
      // Remove answers from this field onward
      const fieldsToKeep = fields.slice(0, fieldIndex)
      const keptIds = new Set(fieldsToKeep.map((f) => f.id))
      setAnswers((prev) => prev.filter((a) => keptIds.has(a.field_id)))
      setCurrentFieldIndex(fieldIndex)
      setFlow("FIELD_LOOP")
      setSummary("")
      addMessage(
        "assistant",
        `Let's update the "${fields[fieldIndex].label}" field.`
      )
    },
    [fields, addMessage]
  )

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
    goToField,
    reset,
    addMessage,
  }
}
