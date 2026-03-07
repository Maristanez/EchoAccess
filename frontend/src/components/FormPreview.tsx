import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, CircleDot, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { BorderBeam } from "@/components/magicui/border-beam"
import type { FormField, Answer } from "@/types"

interface FormPreviewProps {
  formName: string
  fields: FormField[]
  currentFieldIndex: number
  answers: Answer[]
  completionPercent: number
}

export function FormPreview({
  formName,
  fields,
  currentFieldIndex,
  answers,
  completionPercent,
}: FormPreviewProps) {
  const answeredIds = new Set(answers.map((a) => a.field_id))
  const activeRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the active field
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [currentFieldIndex])

  return (
    <Card className="h-full flex flex-col bg-surface-card border border-surface-border rounded-2xl">
      <CardHeader>
        <CardTitle className="font-display font-bold text-text-primary text-lg">{formName}</CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={completionPercent} className="flex-1" aria-label={`Form completion: ${completionPercent}%`} />
          <span className="text-sm text-text-primary/50 whitespace-nowrap">
            {Math.min(currentFieldIndex, fields.length)} of {fields.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2">
        {fields.map((field, i) => {
          const isCompleted = answeredIds.has(field.id)
          const isActive = i === currentFieldIndex
          const answer = answers.find((a) => a.field_id === field.id)

          return (
            <div
              key={field.id}
              ref={isActive ? activeRef : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border p-3 transition-colors",
                isActive && "border-brand-primary bg-brand-primary/10",
                isCompleted && !isActive && "border-text-primary/20 bg-text-primary/[0.04]",
                !isActive && !isCompleted && "border-surface-border"
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isActive && <BorderBeam size={100} duration={8} borderWidth={2} />}
              <div className="shrink-0">
                {isCompleted ? (
                  <Check className="h-4 w-4 text-brand-primary" />
                ) : isActive ? (
                  <CircleDot className="h-4 w-4 text-brand-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-text-primary/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      isCompleted && "text-brand-primary",
                      isActive && "text-brand-primary"
                    )}
                  >
                    {field.label}
                  </span>
                  {field.required && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-surface-border text-text-primary/50">
                      Required
                    </Badge>
                  )}
                </div>
                {isCompleted && answer && (
                  <p className="text-xs text-text-primary/50 truncate mt-0.5">
                    {answer.value}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
