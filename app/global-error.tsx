"use client";

import { ErrorState } from "@/components/ErrorState";
import "./globals.css";

/** Replaces the root layout when it fails, so it brings its own document and styles. */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-background font-sans text-foreground">
        <title>Something went wrong · Opps</title>
        <ErrorState
          error={error}
          retry={retry}
          title="Opps couldn’t load"
          description="The app failed before the page could render. Try again in a moment."
        />
      </body>
    </html>
  );
}
