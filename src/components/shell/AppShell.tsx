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

  useEffect(() => {
    const result = getCurrentUser();
    const current = result.success ? result.data : null;
    setUser(current);
    if (current) {
      const pending = countPendingActionsForUser(current.id);
      setPendingActions(pending.success ? pending.data : 0);
    }
  }, []);

  return (
    <PipelineProvider>
      <UploadDocumentProvider>
        <div className="min-h-screen bg-pae-bg">
          <Header user={user} notificationCount={notificationCount} />
          <Sidebar user={user} pendingActions={pendingActions} />
          <main className="pt-14 md:pl-[220px]">
            <div className="px-6 py-6">{children}</div>
          </main>
        </div>
        <UploadDocumentModal />
      </UploadDocumentProvider>
    </PipelineProvider>
  );
}
