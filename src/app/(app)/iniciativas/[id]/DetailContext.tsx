"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { InitiativeDetail } from "@/lib/storage/initiative_detail";

const DetailContext = createContext<InitiativeDetail | null>(null);

export function DetailProvider({
  detail,
  children,
}: {
  detail: InitiativeDetail;
  children: ReactNode;
}) {
  return (
    <DetailContext.Provider value={detail}>{children}</DetailContext.Provider>
  );
}

export function useInitiativeDetail(): InitiativeDetail {
  const ctx = useContext(DetailContext);
  if (!ctx) {
    throw new Error(
      "useInitiativeDetail debe usarse dentro de DetailProvider",
    );
  }
  return ctx;
}
