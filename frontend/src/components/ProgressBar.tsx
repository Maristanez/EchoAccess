import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
  current: number
  total: number
  percent: number
}

export function ProgressBar({ current, total, percent }: ProgressBarProps) {
  if (total === 0) return null

  return (
    <div className="flex items-center gap-3">
      <Progress
        value={percent}
        className="w-32"
        aria-label={`Form progress: ${current} of ${total} fields completed`}
      />
      <span className="text-xs text-muted-foreground">
        {current}/{total}
      </span>
    </div>
  )
}
