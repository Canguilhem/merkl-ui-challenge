"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Shared body of the error boundaries; the page itself is only a client boundary. */
export function ErrorState({
  error,
  retry,
  title,
  description,
  backToList = false,
}: {
  error: unknown;
  retry: () => void;
  title: string;
  description: ReactNode;
  backToList?: boolean;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-primary">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex gap-2">
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
        {backToList ? (
          <Button variant="outline" asChild>
            <Link href="/">Back to list</Link>
          </Button>
        ) : null}
      </div>
      {digest ? (
        <p className="mt-6 font-mono text-[11px] text-muted-foreground">
          Reference: {digest}
        </p>
      ) : null}
    </main>
  );
}
