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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{formName}</CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={completionPercent} className="flex-1" aria-label={`Form completion: ${completionPercent}%`} />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
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
              className={cn(
                "relative flex items-center gap-3 rounded-lg border p-3 transition-colors",
                isActive && "border-blue-500 bg-blue-500/10",
                isCompleted && !isActive && "border-emerald-500/30 bg-emerald-500/5",
                !isActive && !isCompleted && "border-border"
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isActive && <BorderBeam size={100} duration={8} borderWidth={2} />}
              <div className="shrink-0">
                {isCompleted ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : isActive ? (
                  <CircleDot className="h-4 w-4 text-blue-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      isCompleted && "text-emerald-400",
                      isActive && "text-blue-400"
                    )}
                  >
                    {field.label}
                  </span>
                  {field.required && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      Required
                    </Badge>
                  )}
                </div>
                {isCompleted && answer && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
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
