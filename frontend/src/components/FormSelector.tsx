import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FormInfo } from "@/types"

interface FormSelectorProps {
  forms: FormInfo[]
  selectedForm: FormInfo | null
  onSelect: (form: FormInfo) => void
  disabled?: boolean
}

export function FormSelector({
  forms,
  selectedForm,
  onSelect,
  disabled,
}: FormSelectorProps) {
  const items = forms.map((f) => ({ value: f.id, label: f.name }))

  return (
    <Select
      value={selectedForm?.id ?? null}
      onValueChange={(value) => {
        const form = forms.find((f) => f.id === value)
        if (form) onSelect(form)
      }}
      disabled={disabled}
      items={items}
    >
      <SelectTrigger className="w-[260px] bg-surface-card border-surface-border text-text-primary rounded-xl" aria-label="Select a form to fill out">
        <SelectValue
          placeholder={
            forms.length === 0 ? "Loading forms..." : "Choose a form..."
          }
        />
      </SelectTrigger>
      <SelectContent className="z-[100] bg-surface-card border-surface-border">
        {forms.map((form) => (
          <SelectItem key={form.id} value={form.id} className="text-text-primary focus:bg-brand-primary/10 focus:text-text-primary">
            {form.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
