"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { toolComponents } from "@/lib/tools/registry.client.generated";
import { Alert } from "@/components/ui/Alert";

class ToolErrorBoundary extends Component<{ children: ReactNode; name: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") console.error(`[tool:${this.props.name}]`, error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <Alert variant="error" title="This tool hit an unexpected error">
          Please reload the page and try again. If the problem persists, let us know via the contact page.
        </Alert>
      );
    }
    return this.props.children;
  }
}

/** Looks up the code-split component for `slug` and renders it inside an error boundary. */
export function ToolRenderer({ slug }: { slug: string }) {
  const Tool = toolComponents[slug];
  if (!Tool) {
    return <Alert variant="warning">This tool is not available yet.</Alert>;
  }
  return (
    <ToolErrorBoundary name={slug}>
      <Tool />
    </ToolErrorBoundary>
  );
}
