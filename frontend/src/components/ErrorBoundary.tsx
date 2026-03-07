import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface-page text-text-primary p-8">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" aria-hidden />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-text-primary/70 text-center max-w-md mb-6">
            {this.state.error.message}
          </p>
          <Button onClick={this.handleRetry} variant="outline">
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
