"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

function subscribe() {
  return () => {};
}

// Rounded so the snapshot stays stable between renders, as the store contract requires.
function getNow() {
  return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

function getServerNow() {
  return null;
}

/** Current time for rendering. Null on the server, where it would go stale in HTML. */
export function useNow() {
  return useSyncExternalStore(subscribe, getNow, getServerNow);
}
