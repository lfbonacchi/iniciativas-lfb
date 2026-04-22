"use client";

import { useEffect, useRef, useState } from "react";

import type { GatewayVoteValue } from "@/types";

interface DecisionConfirmPopupProps {
  vote: GatewayVoteValue;
  label: string;
  description: string;
  totalSeconds?: number;
  onUndo: () => void;
  onTimeout: () => void;
}

export function DecisionConfirmPopup({
  vote,
  label,
  description,
  totalSeconds = 60,
  onUndo,
  onTimeout,
}: DecisionConfirmPopupProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const firedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          if (!firedRef.current) {
            firedRef.current = true;
            onTimeout();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onTimeout]);

  void vote;

  const progress = Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[10px] bg-pae-surface p-5 shadow-xl">
        <p className="text-[14px] font-semibold text-pae-text">
          Confirmá tu decisión: {label}
        </p>
        <p className="mt-2 text-[11px] text-pae-text-secondary">
          {description}
        </p>
        <p className="mt-4 text-[11px] text-pae-text-secondary">
          Tenés <span className="font-semibold text-pae-text">{remaining}s</span>{" "}
          para deshacer. Si no hacés nada, la decisión se aplica automáticamente.
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-pae-bg">
          <div
            className="h-full bg-pae-blue transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex h-9 items-center rounded-md border border-pae-red/50 bg-pae-red/5 px-4 text-[11px] font-semibold text-pae-red transition hover:bg-pae-red/10"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={() => {
              if (firedRef.current) return;
              firedRef.current = true;
              onTimeout();
            }}
            className="inline-flex h-9 items-center rounded-md bg-pae-blue px-4 text-[11px] font-semibold text-white hover:bg-pae-blue/90"
          >
            Aplicar ahora
          </button>
        </div>
      </div>
    </div>
  );
}
