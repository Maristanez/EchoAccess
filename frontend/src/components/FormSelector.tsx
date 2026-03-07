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
  return (
    <Select
      value={selectedForm?.id ?? ""}
      onValueChange={(value) => {
        const form = forms.find((f) => f.id === value)
        if (form) onSelect(form)
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-[260px]" aria-label="Select a form to fill out">
        <SelectValue placeholder="Choose a form..." />
      </SelectTrigger>
      <SelectContent>
        {forms.map((form) => (
          <SelectItem key={form.id} value={form.id}>
            {form.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
