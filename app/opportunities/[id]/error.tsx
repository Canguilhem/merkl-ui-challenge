"use client";

import { ErrorState } from "@/components/ErrorState";

export default function OpportunityError({
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
      title="Couldn’t load this opportunity"
      description="Merkl’s API didn’t respond as expected. The opportunity may still exist, so try again or go back to the list."
      backToList
    />
  );
}
