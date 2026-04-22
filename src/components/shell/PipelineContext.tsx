"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { InitiativeStage } from "@/types";

interface PipelineContextValue {
  activeStage: InitiativeStage | null;
  setActiveStage: (stage: InitiativeStage | null) => void;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [activeStage, setActiveStage] = useState<InitiativeStage | null>(null);
  const value = useMemo<PipelineContextValue>(
    () => ({ activeStage, setActiveStage }),
    [activeStage],
  );
  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline(): PipelineContextValue {
  const ctx = useContext(PipelineContext);
  if (!ctx) {
    return { activeStage: null, setActiveStage: () => {} };
  }
  return ctx;
}
