import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-ink-50)] dark:bg-[var(--color-ink-950)]">
          <div className="mx-auto max-w-sm text-center">
            <h1 className="mb-2 text-xl font-bold">Something went wrong</h1>
            <p className="mb-6 text-sm text-[var(--color-ink-500)]">
              An unexpected error occurred. Try reloading the page.
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
