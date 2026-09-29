"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">This page hit an unexpected error</h1>
        <p className="mt-3 text-muted">Nothing you entered was sent anywhere, so nothing is lost on our side. Try again, or go back to the tools list.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/tools" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg hover:bg-surface-2">
            All tools
          </Link>
        </div>
      </div>
    </Container>
  );
}
