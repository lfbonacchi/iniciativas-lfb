"use client";

import { useEffect, useState } from "react";

import type { User } from "@/types";
import { getCurrentUser } from "@/lib/storage/auth";
import { countPendingApprovalsForUser } from "@/lib/storage/gateways";

import { Header } from "./Header";
import { PipelineProvider } from "./PipelineContext";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  notificationCount?: number;
}

export function AppShell({ children, notificationCount }: AppShellProps) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);

  useEffect(() => {
    const result = getCurrentUser();
    const current = result.success ? result.data : null;
    setUser(current);
    if (current) {
      const pending = countPendingApprovalsForUser(current.id);
      setPendingApprovals(pending.success ? pending.data : 0);
    }
  }, []);

  return (
    <PipelineProvider>
      <div className="min-h-screen bg-pae-bg">
        <Header user={user} notificationCount={notificationCount} />
        <Sidebar user={user} pendingApprovals={pendingApprovals} />
        <main className="pt-14 md:pl-[220px]">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </PipelineProvider>
  );
}
