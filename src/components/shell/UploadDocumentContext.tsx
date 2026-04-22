"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Id, InitiativeStage } from "@/types";

interface UploadDefaults {
  initiativeId?: Id;
  stage?: InitiativeStage;
}

interface UploadDocumentContextValue {
  isOpen: boolean;
  defaults: UploadDefaults;
  openUpload: (defaults?: UploadDefaults) => void;
  closeUpload: () => void;
  registerOnUploaded: (cb: () => void) => () => void;
  notifyUploaded: () => void;
}

const UploadDocumentContext = createContext<UploadDocumentContextValue | null>(
  null,
);

export function UploadDocumentProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaults, setDefaults] = useState<UploadDefaults>({});
  const [listeners, setListeners] = useState<Set<() => void>>(new Set());

  const openUpload = useCallback((d?: UploadDefaults) => {
    setDefaults(d ?? {});
    setIsOpen(true);
  }, []);

  const closeUpload = useCallback(() => {
    setIsOpen(false);
  }, []);

  const registerOnUploaded = useCallback((cb: () => void) => {
    setListeners((prev) => {
      const next = new Set(prev);
      next.add(cb);
      return next;
    });
    return () => {
      setListeners((prev) => {
        const next = new Set(prev);
        next.delete(cb);
        return next;
      });
    };
  }, []);

  const notifyUploaded = useCallback(() => {
    listeners.forEach((cb) => cb());
  }, [listeners]);

  const value = useMemo<UploadDocumentContextValue>(
    () => ({
      isOpen,
      defaults,
      openUpload,
      closeUpload,
      registerOnUploaded,
      notifyUploaded,
    }),
    [
      isOpen,
      defaults,
      openUpload,
      closeUpload,
      registerOnUploaded,
      notifyUploaded,
    ],
  );

  return (
    <UploadDocumentContext.Provider value={value}>
      {children}
    </UploadDocumentContext.Provider>
  );
}

export function useUploadDocument(): UploadDocumentContextValue {
  const ctx = useContext(UploadDocumentContext);
  if (!ctx) {
    return {
      isOpen: false,
      defaults: {},
      openUpload: () => {},
      closeUpload: () => {},
      registerOnUploaded: () => () => {},
      notifyUploaded: () => {},
    };
  }
  return ctx;
}
