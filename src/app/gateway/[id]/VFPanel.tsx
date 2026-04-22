"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { enableVFEditing } from "@/lib/storage/gateways";
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
}: VFPanelProps) {
  const router = useRouter();
  const [formStatus, setFormStatus] = useState<FormStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const res = getForm(formId);
    if (res.success) setFormStatus(res.data.form.status);
  }, [formId, currentUserId]);

  function handleOpenVF() {
    setError(null);
    const res = enableVFEditing(gatewayId);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    router.push(`/wizard/${res.data.form_id}`);
  }

  // Interpretación del estado del form para el copy del botón/banner:
  // - draft:       la VF se está editando (o recién se abrió)
  // - approved:    recién se aprobó con cambios; todavía no se tocó la VF
  // - in_review / submitted: ya se reenvió — read-only
  const draftMode = formStatus === "draft";
  const alreadyResubmitted =
    formStatus === "in_review" || formStatus === "submitted";

  return (
    <div className="mt-6 rounded-[10px] border border-pae-amber/30 bg-pae-amber/[0.06] p-4">
      <p className="text-[13px] font-semibold text-pae-text">
        Versión Final (VF) con cambios
      </p>
      <p className="mt-1 text-[10px] text-pae-text-secondary">
        El gateway pidió cambios. Abrí el wizard, incorporá la minuta y el
        feedback, y apretá <strong>Enviar a aprobación</strong> desde el
        mismo wizard — eso crea la próxima revisión automáticamente.
      </p>

      {alreadyResubmitted ? (
        <p className="mt-3 text-[11px] text-pae-text-secondary">
          ✓ La VF ya se reenvió a una revisión posterior. Esta versión quedó
          read-only.
        </p>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleOpenVF}
            className="inline-flex h-8 items-center rounded-md bg-pae-blue px-3 text-[11px] font-semibold text-white transition hover:bg-pae-blue/90"
          >
            {draftMode ? "Continuar editando VF →" : "Abrir VF para editar →"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-[11px] text-pae-red">{error}</p>}
    </div>
  );
}
