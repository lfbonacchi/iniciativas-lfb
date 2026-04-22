"use client";

import { useInitiativeDetail } from "../DetailContext";
import { TabStub } from "../TabStub";

export default function MesaDeTrabajoTab() {
  const detail = useInitiativeDetail();

  if (!detail.is_stage_4_unlocked) {
    return (
      <div className="rounded-xl border border-pae-amber/30 bg-pae-amber/5 p-6">
        <p className="text-[13px] font-semibold text-pae-amber">
          🔒 Mesa de trabajo bloqueada
        </p>
        <p className="mt-2 text-[12px] text-pae-text-secondary">
          Esta pestaña se habilita en etapa Delivery (cuando F3 está aprobado o
          F4 existe).
        </p>
      </div>
    );
  }

  return (
    <TabStub
      title="Mesa de trabajo"
      description="KPIs target vs actual, bloqueantes, brainstorm y temas pendientes. En construcción."
    />
  );
}
