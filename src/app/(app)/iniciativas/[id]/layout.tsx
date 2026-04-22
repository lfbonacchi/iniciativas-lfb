"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/storage/auth";
import {
  getInitiativeDetail,
  type InitiativeDetail,
} from "@/lib/storage/initiative_detail";
import { usePipeline } from "@/components/shell/PipelineContext";

import { DetailHeader } from "./DetailHeader";
import { DetailProvider } from "./DetailContext";

export default function InitiativeDetailLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<InitiativeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setActiveStage } = usePipeline();

  useEffect(() => {
    const userResult = getCurrentUser();
    if (!userResult.success) {
      router.replace("/seleccionar-usuario");
      return;
    }
    const result = getInitiativeDetail(id);
    if (!result.success) {
      if (result.error.code === "AUTH_REQUIRED") {
        router.replace("/seleccionar-usuario");
        return;
      }
      setError(result.error.message);
      return;
    }
    setDetail(result.data);
    setActiveStage(result.data.initiative.current_stage);
  }, [id, router, setActiveStage]);

  useEffect(() => {
    return () => {
      setActiveStage(null);
    };
  }, [setActiveStage]);

  if (error) {
    return (
      <div className="rounded-xl border border-pae-red/30 bg-pae-red/5 p-4">
        <p className="text-[13px] text-pae-red">{error}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
        <p className="text-[14px] text-pae-text-secondary">Cargando…</p>
      </div>
    );
  }

  return (
    <DetailProvider detail={detail}>
      <div className="space-y-6">
        <DetailHeader detail={detail} />
        <div>{children}</div>
      </div>
    </DetailProvider>
  );
}
