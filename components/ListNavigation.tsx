"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";

type ListNavigationValue = {
  isPending: boolean;
  navigate: (href: string) => void;
};

const ListNavigationContext = createContext<ListNavigationValue | null>(null);

export function useListNavigation() {
  const value = useContext(ListNavigationContext);
  if (!value) {
    throw new Error("useListNavigation must be used in ListNavigationProvider");
  }
  return value;
}

/** Runs filter, sort and page changes in one transition so the list can show them as pending. */
export function ListNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (href: string) => {
    startTransition(() => router.push(href));
  };

  return (
    <ListNavigationContext.Provider value={{ isPending, navigate }}>
      {children}
    </ListNavigationContext.Provider>
  );
}

/** `Link` whose client navigation joins the list transition. */
export function ListLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & { href: string }) {
  const { navigate } = useListNavigation();

  return (
    <Link
      href={href}
      onNavigate={(event) => {
        event.preventDefault();
        navigate(href);
      }}
      {...props}
    />
  );
}

/** Dims current results while the next ones load; the delay hides it for cached queries. */
export function ListResults({ children }: { children: ReactNode }) {
  const { isPending } = useListNavigation();

  return (
    <div
      aria-busy={isPending}
      className={`space-y-3 transition-opacity ${
        isPending ? "opacity-50 delay-150" : ""
      }`}
    >
      {children}
    </div>
  );
}
