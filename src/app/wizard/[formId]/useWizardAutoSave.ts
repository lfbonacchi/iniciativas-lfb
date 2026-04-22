"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FormFieldValue, Id } from "@/types";
import { saveFormResponses } from "@/lib/storage/forms";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const BLUR_DEBOUNCE_MS = 1000;
const AUTO_SAVE_INTERVAL_MS = 30_000;

export interface WizardAutoSaveState {
  status: SaveStatus;
  errorMessage: string | null;
  lastSavedAt: number | null;
  scheduleFieldChange: (key: string, value: FormFieldValue) => void;
  flushOnBlur: () => void;
  flushNow: () => Promise<void>;
}

/**
 * Coordina el autoguardado de un formulario:
 * - Acumula campos "sucios" en un buffer.
 * - flushOnBlur() → dispara guardado con debounce de 1 s (se cancela si el
 *   usuario sigue tipeando en otro campo antes del timeout).
 * - Cada 30 s fuerza un flush aunque no haya habido blur.
 * - flushNow() fuerza el guardado inmediato (se usa antes de Submit).
 */
export function useWizardAutoSave(formId: Id): WizardAutoSaveState {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Campos pendientes de enviar (por section-key).
  const dirtyRef = useRef<Record<string, FormFieldValue>>({});
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSavingRef = useRef(false);

  const doFlush = useCallback(async () => {
    if (isSavingRef.current) return;
    const pending = dirtyRef.current;
    const keys = Object.keys(pending);
    if (keys.length === 0) return;

    dirtyRef.current = {};
    isSavingRef.current = true;
    setStatus("saving");
    setErrorMessage(null);
    try {
      const result = saveFormResponses(formId, pending);
      if (result.success) {
        setStatus("saved");
        setLastSavedAt(Date.now());
      } else {
        setStatus("error");
        setErrorMessage(result.error.message);
        // devolver los campos al buffer para reintento
        dirtyRef.current = { ...pending, ...dirtyRef.current };
      }
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : "Error al guardar");
      dirtyRef.current = { ...pending, ...dirtyRef.current };
    } finally {
      isSavingRef.current = false;
    }
  }, [formId]);

  const scheduleFieldChange = useCallback(
    (key: string, value: FormFieldValue) => {
      dirtyRef.current[key] = value;
    },
    [],
  );

  const flushOnBlur = useCallback(() => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      void doFlush();
    }, BLUR_DEBOUNCE_MS);
  }, [doFlush]);

  const flushNow = useCallback(async () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    await doFlush();
  }, [doFlush]);

  // Interval fijo: guardado cada 30 s.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      void doFlush();
    }, AUTO_SAVE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [doFlush]);

  // Guardar antes de cerrar la pestaña/pantalla.
  useEffect(() => {
    const handler = () => {
      if (Object.keys(dirtyRef.current).length > 0) {
        void doFlush();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [doFlush]);

  return {
    status,
    errorMessage,
    lastSavedAt,
    scheduleFieldChange,
    flushOnBlur,
    flushNow,
  };
}

export function formatLastSaved(ts: number | null, now: number): string | null {
  if (ts == null) return null;
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 5) return "recién";
  if (diffSec < 60) return `hace ${diffSec} s`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  return `hace ${hrs} h`;
}
