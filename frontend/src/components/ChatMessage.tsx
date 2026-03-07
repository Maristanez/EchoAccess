import { BlurFade } from "@/components/magicui/blur-fade"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  index: number
}

export function ChatMessage({ role, content, index }: ChatMessageProps) {
  return (
    <BlurFade delay={0.05 * Math.min(index, 5)} inView>
      <div
        className={cn(
          "flex gap-3 items-start",
          role === "user" ? "flex-row-reverse" : "flex-row"
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback
            className={cn(
              "text-xs font-semibold",
              role === "user"
                ? "bg-brand-primary text-white dark:text-black"
                : "bg-surface-section text-text-primary/70 border border-surface-border"
            )}
          >
            {role === "user" ? "U" : "EA"}
          </AvatarFallback>
        </Avatar>
        <Card
          className={cn(
            "max-w-[80%] shadow-sm",
            role === "user"
              ? "bg-brand-primary text-white dark:text-black border-brand-primary/70 rounded-2xl"
              : "bg-surface-card text-text-primary border-surface-border rounded-2xl"
          )}
        >
          <CardContent className="p-3 text-sm leading-relaxed">
            {content}
          </CardContent>
        </Card>
      </div>
    </BlurFade>
  )
}
