"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  enableVFEditing,
  resubmitForRevision,
} from "@/lib/storage/gateways";
import { getForm } from "@/lib/storage/forms";
import type { FormStatus } from "@/types";

interface VFPanelProps {
  gatewayId: string;
  formId: string;
  initiativeId: string;
  currentUserId: string | null;
  onResubmitted: () => void;
}

export function VFPanel({
  gatewayId,
  formId,
  currentUserId,
  onResubmitted,
}: VFPanelProps) {
  const router = useRouter();
  const [formStatus, setFormStatus] = useState<FormStatus | null>(null);
  const [canEditFlag, setCanEditFlag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const res = getForm(formId);
    if (res.success) {
      setFormStatus(res.data.form.status);
      setCanEditFlag(res.data.can_edit);
    }
  }, [formId, currentUserId]);

  function handleOpenVF() {
    setError(null);
    setMsg(null);
    const res = enableVFEditing(gatewayId);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    router.push(`/wizard/${res.data.form_id}`);
  }

  function handleResubmit() {
    if (
      !confirm(
        "Esto crea un nuevo gateway con la VF actualizada. ¿Seguir?",
      )
    ) {
      return;
    }
    setError(null);
    const res = resubmitForRevision(gatewayId);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setMsg(
      `Nuevo gateway creado (revisión ${res.data.revision_number}). Se notificó a los aprobadores.`,
    );
    onResubmitted();
  }

  // Estado del form: si está en draft, VF está en edición; si en in_review,
  // ya se reenvió a gateway; si approved, aún no se empezó a editar.
  const draftMode = formStatus === "draft";
  const alreadyResubmitted = formStatus === "in_review";

  return (
    <div className="mt-6 rounded-[10px] border border-pae-amber/30 bg-pae-amber/[0.06] p-4">
      <p className="text-[13px] font-semibold text-pae-text">
        Versión Final (VF) con cambios
      </p>
      <p className="mt-1 text-[10px] text-pae-text-secondary">
        El gateway pidió cambios. El PO debe editar la VF incorporando la
        minuta y el feedback, y reenviarla a gateway para la próxima revisión.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!alreadyResubmitted && (
          <button
            type="button"
            onClick={handleOpenVF}
            disabled={!canEditFlag && !draftMode}
            className="inline-flex h-8 items-center rounded-md bg-pae-blue px-3 text-[11px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {draftMode ? "Continuar editando VF →" : "Abrir VF para editar →"}
          </button>
        )}

        {draftMode && (
          <button
            type="button"
            onClick={handleResubmit}
            className="inline-flex h-8 items-center rounded-md bg-pae-green px-3 text-[11px] font-semibold text-white transition hover:bg-pae-green/90"
          >
            Enviar a gateway
          </button>
        )}

        {alreadyResubmitted && (
          <p className="text-[11px] text-pae-text-secondary">
            La VF ya se reenvió a un nuevo gateway — esperando votos.
          </p>
        )}
      </div>

      {msg && <p className="mt-3 text-[11px] text-pae-green">{msg}</p>}
      {error && <p className="mt-3 text-[11px] text-pae-red">{error}</p>}
    </div>
  );
}
