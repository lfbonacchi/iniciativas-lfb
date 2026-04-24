"use client";

import { useEffect, useState } from "react";

import type { User } from "@/types";
import { getCurrentUser } from "@/lib/storage/auth";
import { countPendingActionsForUser } from "@/lib/storage/gateways";

import { Header } from "./Header";
import { PipelineProvider } from "./PipelineContext";
import { Sidebar } from "./Sidebar";
import { UploadDocumentProvider } from "./UploadDocumentContext";
import { UploadDocumentModal } from "./UploadDocumentModal";

interface AppShellProps {
  children: React.ReactNode;
  notificationCount?: number;
}

export function AppShell({ children, notificationCount }: AppShellProps) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingActions, setPendingActions] = useState<number>(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Cargar usuario desde localStorage inmediatamente
    const result = getCurrentUser();
    const current = result.success ? result.data : null;
    setUser(current);
    if (current) {
      const pending = countPendingActionsForUser(current.id);
      setPendingActions(pending.success ? pending.data : 0);
    }

    // En paralelo, sincronizar datos frescos desde la DB
    // Solo una vez por sesión (usando sessionStorage como flag)
    const syncKey = "pae-db-synced";
    if (!sessionStorage.getItem(syncKey)) {
      sessionStorage.setItem(syncKey, "1");
      fetch("/api/store")
        .then((res) => res.ok ? res.json() : null)
        .then((store) => {
          if (!store) return;
          const { writeStore, readStore } = require("@/lib/storage/_store");
          const curr = readStore();
          writeStore({ ...store, current_user_id: curr.current_user_id });
          // Recargar la página para mostrar datos frescos
          window.location.reload();
        })
        .catch(() => {});
    }
  }, []);

  return (
    <PipelineProvider>
      <UploadDocumentProvider>
        <div className="min-h-screen bg-pae-bg">
          <Header
            user={user}
            notificationCount={notificationCount}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
          />
          <Sidebar
            user={user}
            pendingActions={pendingActions}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
          <main className="pt-14 md:pl-[220px]">
            <div className="px-4 py-4 md:px-6 md:py-6">{children}</div>
          </main>
        </div>
        <UploadDocumentModal />
      </UploadDocumentProvider>
    </PipelineProvider>
  );
}
