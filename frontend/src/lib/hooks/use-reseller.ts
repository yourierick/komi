"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

import { resellerLinkAPI } from "~/lib/api";

export type Reseller = { id: number; name: string; email: string };

// a listing renders many cards sharing the same ?ref= code: cache the lookup
// so we don't fire one identical request per card
const resellerCache = new Map<string, Promise<Reseller | null>>();

function resolveReseller(code: string): Promise<Reseller | null> {
  if (!resellerCache.has(code)) {
    resellerCache.set(
      code,
      resellerLinkAPI
        .getResellerByCode(code)
        .then((response: any) => response.data.data as Reseller)
        .catch(() => null)
    );
  }
  return resellerCache.get(code)!;
}

/**
 * Resolves the reseller behind a resale link (`?ref=CODE`). Returns null when
 * there is no code or the code is unknown.
 */
export function useResellerFromUrl(): Reseller | null {
  const searchParams = useSearchParams();
  const refCode = searchParams?.get("ref");
  const [reseller, setReseller] = React.useState<Reseller | null>(null);

  React.useEffect(() => {
    if (!refCode) {
      setReseller(null);
      return;
    }
    let active = true;
    resolveReseller(refCode).then((resolved) => {
      if (active) setReseller(resolved);
    });
    return () => {
      active = false;
    };
  }, [refCode]);

  return reseller;
}
