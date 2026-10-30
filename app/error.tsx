"use client";

import { ErrorState } from "@/components/ErrorState";

export default function ListError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      title="Couldn’t load opportunities"
      description="Merkl’s API didn’t respond as expected. Results you already loaded recently are still cached, so trying again often works."
    />
  );
}
