import Link from "next/link";

export default function OpportunityNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">
        Opportunity not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This id is missing or no longer available from Merkl.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/85"
      >
        Back to list
      </Link>
    </main>
  );
}
