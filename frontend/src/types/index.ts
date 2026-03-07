export interface FormField {
  id: string
  label: string
  type: string
  required: boolean
  placeholder: string
  options: string[] | null
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export type FlowState =
  | "IDLE"
  | "FORM_SELECTED"
  | "PARSING"
  | "FIELD_LOOP"
  | "CONFIRMING"
  | "SUBMITTED"

export interface FormInfo {
  id: string
  name: string
}

export interface Answer {
  field_id: string
  label: string
  value: string
}
