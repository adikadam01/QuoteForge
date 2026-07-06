import type { ReactNode } from "react";
import React from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export default class DebugErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log only in dev builds.
    if (import.meta.env.DEV) {
      console.error("[DebugErrorBoundary] Caught error:", error);
      console.error("[DebugErrorBoundary] Component stack:", info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground p-6">
          <h1 className="text-xl font-semibold">Render crash detected</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the browser console to see the full stack trace.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-md border border-border bg-muted p-4 text-sm">
            {this.state.error.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
