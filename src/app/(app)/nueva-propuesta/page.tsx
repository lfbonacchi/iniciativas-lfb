"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { InitiativeStage } from "@/types";
import { getCurrentUser } from "@/lib/storage/auth";
import {
  createInitiative,
  searchInitiatives,
  type InitiativeSearchResult,
} from "@/lib/storage/initiatives";

const STAGE_LABEL: Record<InitiativeStage, string> = {
  proposal: "Propuesta",
  dimensioning: "Dimensionamiento",
  mvp: "MVP",
  ltp_tracking: "Delivery",
};

function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <mark className="rounded bg-pae-blue/15 px-0.5 text-pae-blue">
        {match}
      </mark>
      {after}
    </>
  );
}

export default function NuevaPropuestaPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [allInitiatives, setAllInitiatives] = useState<
    InitiativeSearchResult[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(true);

  useEffect(() => {
    const userResult = getCurrentUser();
    if (!userResult.success) {
      router.replace("/seleccionar-usuario");
      return;
    }
    const user = userResult.data;
    setCanCreate(user.global_role === "area_transformacion" || !user.is_vp);

    const result = searchInitiatives("");
    if (result.success) {
      setAllInitiatives(result.data);
    }
    setLoading(false);
  }, [router]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allInitiatives.filter((ini) =>
      ini.name.toLowerCase().includes(q),
    );
  }, [allInitiatives, query]);

  const trimmed = query.trim();
  const canSubmitNew = canCreate && trimmed.length >= 3 && !creating;

  function handleCreate() {
    if (!canSubmitNew) return;
    setCreating(true);
    setError(null);
    const result = createInitiative(trimmed);
    setCreating(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.push(
      `/iniciativas/${result.data.initiative.id}/formularios/F1`,
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
        <p className="text-[14px] text-pae-text-secondary">Cargando…</p>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="space-y-5">
        <h1 className="text-[18px] font-semibold text-pae-text">
          Nueva propuesta
        </h1>
        <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
          <p className="text-[14px] text-pae-text-secondary">
            Tu rol no puede crear nuevas propuestas. Los VP y BO solo pueden
            revisar y aprobar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[18px] font-semibold text-pae-text">
          Nueva propuesta
        </h1>
        <p className="mt-1 text-[13px] text-pae-text-secondary">
          Buscá una iniciativa existente o creá una nueva
        </p>
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-pae-text-tertiary">
          🔍
        </span>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribí el nombre de una iniciativa…"
          className="h-11 w-full rounded-xl border-[1.5px] border-pae-blue bg-pae-surface pl-10 pr-4 text-[14px] text-pae-text placeholder:text-pae-text-tertiary focus:outline-none focus:ring-2 focus:ring-pae-blue/20"
        />
      </div>

      {/* Zona 1 — Resultados existentes */}
      <section aria-labelledby="resultados-existentes">
        <h2
          id="resultados-existentes"
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary"
        >
          Resultados existentes
        </h2>

        {!trimmed ? (
          <p className="rounded-xl border border-dashed border-pae-border bg-pae-surface/60 px-4 py-3 text-[13px] text-pae-text-tertiary">
            Empezá a escribir para ver coincidencias.
          </p>
        ) : matches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-pae-border bg-pae-surface/60 px-4 py-3 text-[13px] text-pae-text-tertiary">
            Ninguna iniciativa coincide con &ldquo;{trimmed}&rdquo;.
          </p>
        ) : (
          <ul className="space-y-2">
            {matches.map((ini) => (
              <li
                key={ini.id}
                className="flex items-center gap-3 rounded-xl border border-pae-border bg-pae-surface px-4 py-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-pae-text">
                    {highlight(ini.name, trimmed)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-pae-text-secondary">
                    {ini.po_display_name
                      ? `PO: ${ini.po_display_name}`
                      : "Sin PO asignado"}{" "}
                    · {ini.status_label}
                  </p>
                </div>
                <span className="rounded-full bg-pae-blue/10 px-2.5 py-[3px] text-[11px] font-medium text-pae-blue">
                  {STAGE_LABEL[ini.current_stage]}
                </span>
                <Link
                  href={`/iniciativas/${ini.id}/formularios/${ini.current_form_type}`}
                  className="shrink-0 rounded-lg border border-pae-border bg-pae-surface px-3 py-1.5 text-[12px] font-medium text-pae-blue transition hover:bg-pae-blue/5"
                >
                  Abrir {ini.current_form_type}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Zona 2 — Crear nueva (siempre visible) */}
      <section aria-labelledby="crear-nueva">
        <h2
          id="crear-nueva"
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary"
        >
          ¿No encontrás lo que buscás?
        </h2>

        <div className="flex items-center gap-4 rounded-xl border-[1.5px] border-dashed border-pae-blue bg-pae-blue/[0.03] px-4 py-4">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pae-blue/10 text-[20px] font-semibold text-pae-blue"
            aria-hidden
          >
            +
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-pae-text">
              Crear{" "}
              <span className="text-pae-blue">
                &ldquo;{trimmed || "nueva iniciativa"}&rdquo;
              </span>{" "}
              como nueva iniciativa
            </p>
            <p className="mt-0.5 text-[12px] text-pae-text-secondary">
              Se crea carpeta en SharePoint y se abre Formulario 1 en blanco.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmitNew}
            className={`shrink-0 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition ${
              canSubmitNew
                ? "bg-pae-blue hover:bg-pae-blue/90"
                : "cursor-not-allowed bg-pae-blue/40"
            }`}
          >
            {creating ? "Creando…" : "Crear"}
          </button>
        </div>

        {trimmed.length > 0 && trimmed.length < 3 && (
          <p className="mt-2 text-[12px] text-pae-text-tertiary">
            Escribí al menos 3 caracteres.
          </p>
        )}
        {error && (
          <p className="mt-2 rounded-lg bg-pae-red/10 px-3 py-2 text-[13px] text-pae-red">
            {error}
          </p>
        )}
      </section>

      <p className="text-[11px] text-pae-text-tertiary">
        Las iniciativas se sincronizan con las carpetas de SharePoint.
      </p>

      {/* Nota post-MVP con borde punteado */}
      <div className="rounded-lg border border-dashed border-pae-amber bg-pae-amber/5 px-4 py-3">
        <p className="text-[11px] text-pae-amber">
          <span className="font-semibold">Post-MVP:</span> se conecta con
          nombres de carpetas SharePoint o SAP para autocompletar iniciativas
          existentes.
        </p>
      </div>
    </div>
  );
}
